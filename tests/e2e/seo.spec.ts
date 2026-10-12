import { expect, test } from './fixtures';

test('head com título, descrição, canonical, Open Graph e JSON-LD', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('JornadaPet: agenda e clientes para adestradores de cães');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pt_BR');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', '/favicon-32.png');
  for (const arquivo of ['/favicon-32.png', '/favicon-16.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/og.png']) {
    expect((await page.request.get(arquivo)).status(), arquivo).toBe(200);
  }
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

test('canonical e og:url sem index.html nem .html', async ({ page }) => {
  for (const [rota, esperado] of [['/', 'http://localhost:4321/'], ['/privacidade', 'http://localhost:4321/privacidade']]) {
    await page.goto(rota);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', esperado);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', esperado);
  }
});

test('política de privacidade final: controlador, operadores, prazo e direitos', async ({ page }) => {
  await page.goto('/privacidade');
  const main = page.locator('main');
  await expect(main).not.toContainText('Rascunho');
  await expect(main).not.toContainText('[Preencher');
  for (const trecho of ['35.998.763/0001-58', 'Cloudflare', 'Supabase', 'São Paulo', 'Telegram', '12 meses', 'consentimento', 'revogar', 'ANPD', 'contato@jornadapet.com.br']) {
    await expect(main).toContainText(trecho);
  }
});

test('aceite cita a política e não promete "não compartilhar"', async ({ page }) => {
  await page.goto('/#participe');
  const aceite = page.locator('label', { has: page.locator('#f-aceite') });
  await expect(aceite).toContainText('Aceito ser contatado(a) pela JornadaPet pelo WhatsApp sobre o teste.');
  await expect(aceite).not.toContainText('não serão compartilhados');
  await expect(aceite.getByRole('link', { name: /Política de privacidade/ })).toHaveAttribute('href', '/privacidade');
});
