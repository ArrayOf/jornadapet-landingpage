import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const SERVICO = '**/api/convite';

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
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeFocused();
  await expect(page.getByText('(19) 99876-1234')).toBeVisible();
  expect(corpo).not.toHaveProperty('access_key');
  expect(corpo['cf-turnstile-response']).toBe('token-de-teste');
  expect(corpo).toMatchObject({ nome: 'Camila Duarte', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: 'Campinas, SP', utm_source: 'instagram', ref: 'marcos' });
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

test('barra fixa some quando o formulário está na tela', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'barra só no celular');
  await page.goto('/');
  await page.locator('#sobre').scrollIntoViewIfNeeded();
  await expect(page.locator('.cta', { hasText: 'Quero meu convite' }).last()).toBeVisible();
  await page.locator('#participe form').scrollIntoViewIfNeeded();
  await expect(page.locator('[x-show*="formVisivel"] .cta')).toBeHidden();
});

test('link da política no aceite abre em nova aba (não perde o que foi digitado)', async ({ page }) => {
  await page.goto('/#participe');
  const link = page.locator('#participe form').getByRole('link', { name: /Política de privacidade/ });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('o formulário envia para o nosso endpoint, não para serviço externo', async ({ page }) => {
  await page.goto('/#participe');
  await expect(page.locator('#participe form')).toHaveAttribute('action', '/api/convite');
});

test('sem JS, falha no envio leva a uma página que explica e volta ao formulário', async ({ page }) => {
  const r = await page.goto('/nao-enviado');
  expect(r?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Não conseguimos enviar seu pedido');
  await expect(page.getByRole('link', { name: 'Tentar de novo' })).toHaveAttribute('href', '/#participe');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('sem JS, o formulário some e aparece o aviso com o e-mail', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/#participe');
  await expect(page.locator('#participe form')).toBeHidden();
  await expect(page.locator('#participe')).toContainText('Para pedir seu convite, ative o JavaScript');
  await expect(page.locator('#participe')).toContainText('contato@jornadapet.com.br');
  await ctx.close();
});

test('erro no envio renova o Turnstile para a próxima tentativa', async ({ page }) => {
  await page.route(SERVICO, (r) => r.fulfill({ status: 403, json: { success: false, codigo: 'turnstile' } }));
  await page.goto('/#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('alert')).toContainText('Não conseguimos enviar agora');
  expect(await page.evaluate(() => (window as unknown as { turnstile: { resets: number } }).turnstile.resets)).toBe(1);
});
