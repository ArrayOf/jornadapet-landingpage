import { expect, test, type Page } from '@playwright/test';

const SERVICO = 'https://api.web3forms.com/submit';

async function preencher(page: Page) {
  await page.getByLabel('Seu nome').fill('  Camila Duarte ');
  await page.getByLabel('WhatsApp', { exact: true }).fill('+55 19 99876-1234');
  await page.locator('label.chip-opt', { hasText: 'Adestramento' }).click();
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
}

test('envio vazio mostra os erros e foca o primeiro campo da tela', async ({ page }) => {
  await page.goto('/#participe');
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByText('Diga como podemos chamar você.')).toBeVisible();
  await expect(page.getByText('Precisamos do seu aceite para entrar em contato.')).toBeVisible();
  await expect(page.getByLabel('Seu nome')).toBeFocused();
  await expect(page.getByLabel('Seu nome')).toHaveAttribute('aria-invalid', 'true');
});

test('envio com sucesso: corpo certo, agradece pelo primeiro nome e repete o WhatsApp', async ({ page }) => {
  let corpo: Record<string, string> = {};
  await page.route(SERVICO, async (r) => { corpo = r.request().postDataJSON(); await r.fulfill({ json: { success: true } }); });
  await page.goto('/?utm_source=instagram&ref=marcos#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
  await expect(page.getByText('(19) 99876-1234')).toBeVisible();
  expect(corpo).toMatchObject({ access_key: 'chave-de-teste', nome: 'Camila Duarte', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: 'Campinas, SP', utm_source: 'instagram', ref: 'marcos' });
});

test('erro do serviço mantém os dados e permite tentar de novo', async ({ page }) => {
  let vezes = 0;
  await page.route(SERVICO, async (r) => { vezes++; await r.fulfill(vezes === 1 ? { status: 500, json: { success: false } } : { json: { success: true } }); });
  await page.goto('/#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('alert')).toContainText('Não conseguimos enviar agora');
  await expect(page.getByLabel('Seu nome')).toHaveValue(/Camila Duarte/);
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
});

test('duplo clique envia uma vez', async ({ page }) => {
  let vezes = 0;
  await page.route(SERVICO, async (r) => { vezes++; await new Promise((ok) => setTimeout(ok, 300)); await r.fulfill({ json: { success: true } }); });
  await page.goto('/#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).dblclick();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
  expect(vezes).toBe(1);
});

test('cartão do Para quem marca o perfil no formulário', async ({ page }) => {
  await page.goto('/');
  await page.locator('#para-quem a[data-perfil="Creche ou hotel"]').click();
  await expect(page.locator('input[name="perfil"][value="Creche ou hotel"]')).toBeChecked();
});

test('envia sem JS e chega ao obrigado', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.route(SERVICO, async (r) => {
    const dados = new URLSearchParams(r.request().postData() ?? '');
    expect(dados.get('nome')).toBe('Camila Duarte');
    await r.fulfill({ status: 303, headers: { location: dados.get('redirect') ?? '' } });
  });
  await page.goto('/#participe');
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp', { exact: true }).fill('(19) 99876-1234');
  await page.locator('input[name="perfil"][value="Adestramento"]').check({ force: true });
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page).toHaveURL(/\/obrigado$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recebemos seu pedido!');
  await ctx.close();
});

test('barra fixa some quando o formulário está na tela', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'barra só no celular');
  await page.goto('/');
  await page.locator('#sobre').scrollIntoViewIfNeeded();
  await expect(page.locator('.cta', { hasText: 'Quero testar' }).last()).toBeVisible();
  await page.locator('#participe form').scrollIntoViewIfNeeded();
  await expect(page.locator('[x-show*="formVisivel"] .cta')).toBeHidden();
});
