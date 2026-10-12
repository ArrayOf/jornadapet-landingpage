import { expect, test } from '@playwright/test';

test('head com título, descrição, canonical, Open Graph e JSON-LD', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('JornadaPet: agenda e clientes para adestradores de cães');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pt_BR');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  const tipos = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent ?? '{}')['@type']));
  expect(tipos).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));
});

test('robots fora de produção bloqueia tudo', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(await r.text()).toContain('Disallow: /');
});

test('privacidade, obrigado e 404 existem', async ({ page }) => {
  await page.goto('/privacidade');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidade');
  const r = await page.goto('/nao-existe');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada');
});
