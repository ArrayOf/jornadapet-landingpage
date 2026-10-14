import { expect, test } from './fixtures';
import { TURNSTILE_FALSO } from './fixtures';

const CLOUDFLARE = 'https://challenges.cloudflare.com/';

test('Turnstile não carrega no topo da página, só perto do formulário', async ({ page }) => {
  const pedidos: string[] = [];
  page.on('request', (r) => { if (r.url().startsWith(CLOUDFLARE)) pedidos.push(r.url()); });
  await page.goto('/');
  await page.waitForTimeout(1500);
  expect(pedidos).toEqual([]);
  await page.locator('#participe').scrollIntoViewIfNeeded();
  await expect.poll(() => pedidos.length).toBeGreaterThan(0);
  await expect(page.locator('#participe input[name="cf-turnstile-response"]')).toHaveCount(1);
});

test('envio logo depois de chegar ao formulário espera o token do Turnstile', async ({ page }) => {
  test.setTimeout(45_000);
  await page.route(`${CLOUDFLARE}turnstile/**`, async (r) => {
    await new Promise((ok) => setTimeout(ok, 6000));
    await r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_FALSO });
  });
  let corpo: Record<string, string> = {};
  await page.route('**/api/convite', async (r) => { corpo = r.request().postDataJSON(); await r.fulfill({ json: { success: true } }); });
  // A pessoa abre no topo e rola até o formulário: o script do Turnstile só é pedido agora, depois do carregamento.
  await page.goto('/');
  await page.locator('#participe').scrollIntoViewIfNeeded();
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp', { exact: true }).fill('(19) 99876-1234');
  await page.locator('label.chip-opt', { hasText: 'Adestramento' }).click();
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible({ timeout: 15_000 });
  expect(corpo['cf-turnstile-response']).toBe('token-de-teste');
});

test('CSS vem dentro do HTML, sem arquivo bloqueante', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(0);
});

test('as duas fontes são pré-carregadas e usadas', async ({ page }) => {
  const fontes: string[] = [];
  page.on('response', (r) => { if (r.url().endsWith('.woff2')) fontes.push(r.url()); });
  await page.goto('/');
  const preloads = page.locator('link[rel="preload"][as="font"][type="font/woff2"][crossorigin]');
  await expect(preloads).toHaveCount(2);
  const hrefs = await preloads.evaluateAll((ls) => ls.map((l) => (l as HTMLLinkElement).href));
  expect(hrefs.some((h) => h.includes('bricolage'))).toBe(true);
  expect(hrefs.some((h) => h.includes('instrument'))).toBe(true);
  await expect.poll(() => fontes.length).toBeGreaterThanOrEqual(2);
  for (const h of hrefs) expect(fontes, 'o arquivo pré-carregado é o mesmo que o CSS usa').toContain(h);
});

test('o que foi digitado antes de o Alpine ligar não se perde', async ({ page }) => {
  // Atrasa o JavaScript da página: a pessoa digita antes de a página "acordar" (rede ou celular lento).
  await page.route(/\/_astro\/[^/]+\.js$/, async (r) => { await new Promise((ok) => setTimeout(ok, 2500)); await r.continue(); });
  let corpo: Record<string, string> = {};
  await page.route('**/api/convite', async (r) => { corpo = r.request().postDataJSON(); await r.fulfill({ json: { success: true } }); });
  await page.goto('/#participe', { waitUntil: 'commit' });
  await expect(page.getByLabel('Seu nome')).toBeVisible();
  expect(await page.evaluate(() => 'Alpine' in window)).toBe(false);
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp', { exact: true }).fill('(19) 99876-1234');
  await page.locator('input[name="perfil"][value="Adestramento"]').check({ force: true });
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
  await expect.poll(() => page.evaluate(() => 'Alpine' in window), { timeout: 10_000 }).toBe(true);
  await expect(page.getByLabel('Seu nome')).toHaveValue('Camila Duarte');
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible({ timeout: 15_000 });
  expect(corpo).toMatchObject({ nome: 'Camila Duarte', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: 'Campinas, SP' });
});
