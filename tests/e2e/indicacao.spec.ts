import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const REGEX = /^[a-hjkmnp-z2-9]{8}$/;

async function enviar(page: Page, corpos: Record<string, string>[], whats = '(19) 99876-1234') {
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp', { exact: true }).fill(whats);
  await page.locator('label.chip-opt', { hasText: 'Adestramento' }).click();
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  const aceite = page.getByLabel(/Aceito ser contatado/);
  if (!(await aceite.isChecked())) await aceite.check();
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeFocused();
}
async function abrir(page: Page, corpos: Record<string, string>[]) {
  await page.route('**/api/convite', async (r) => { corpos.push(r.request().postDataJSON()); await r.fulfill({ json: { success: true } }); });
  await page.goto('/#participe');
}

test('sucesso convida a indicar, com código e UTMs no link do WhatsApp', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  const codigo = corpos[0].codigo_indicacao;
  expect(codigo).toMatch(REGEX);
  await expect(page.getByText('Conhece mais alguém que adestra?')).toBeVisible();
  await expect(page.getByText('Se o seu colega também pedir, vocês entram na mesma turma.')).toBeVisible();
  await expect(page.getByText('em até 3 dias úteis para conversar')).toBeVisible();
  const href = await page.getByRole('link', { name: /Enviar pelo WhatsApp/ }).getAttribute('href');
  const mensagem = decodeURIComponent(href!.replace('https://wa.me/?text=', ''));
  expect(mensagem).toContain(`http://localhost:4321/?ref=${codigo}&utm_source=indicacao&utm_medium=whatsapp`);
  expect(mensagem.startsWith('Pedi convite para testar a JornadaPet')).toBe(true);
});

test('copiar link: área de transferência com utm_medium=link e anúncio único', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByRole('button', { name: 'Copiar link' })).toBeVisible();
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Link copiado.' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`http://localhost:4321/?ref=${corpos[0].codigo_indicacao}&utm_source=indicacao&utm_medium=link`);
});

test('sem área de transferência: campo do link com foco e seleção', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
    document.execCommand = () => false;
  });
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  const campo = page.getByLabel('Seu link');
  await expect(campo).toBeFocused();
  await expect(campo).toHaveValue(`http://localhost:4321/?ref=${corpos[0].codigo_indicacao}&utm_source=indicacao&utm_medium=link`);
  await expect(page.getByText('Toque e segure o link para copiar.')).toBeVisible();
});

test('mesmo aparelho: WhatsApp diferente ganha código diferente; o mesmo reusa', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos);
  await enviar(page, corpos, '(19) 99876-1234');
  await page.getByRole('button', { name: 'Errou algum dado? Enviar de novo' }).click();
  await expect(page.getByLabel('Seu nome')).toBeFocused();
  await enviar(page, corpos, '(11) 98765-4321');
  await page.getByRole('button', { name: 'Errou algum dado? Enviar de novo' }).click();
  await enviar(page, corpos, '(19) 99876-1234');
  expect(corpos[1].codigo_indicacao).not.toBe(corpos[0].codigo_indicacao);
  expect(corpos[2].codigo_indicacao).toBe(corpos[0].codigo_indicacao);
});

test('sem WhatsApp da empresa, sem "Salve nosso número"', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await expect(page.getByText('Salve nosso número')).toHaveCount(0);
});

test('celular: barra fixa some depois do pedido', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'barra só existe no celular');
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  // No topo a barra já some (o botão do hero está à vista); em Como funciona ela apareceria.
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(page.locator('[x-show*="formVisivel"] .cta')).toBeHidden();
});
