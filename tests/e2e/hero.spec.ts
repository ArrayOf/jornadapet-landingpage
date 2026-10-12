import { expect, test } from '@playwright/test';

test('hero com o texto da spec, CTA e linha de apoio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Adestrador: saiba quem já pagou e quem ainda falta.');
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero testar' })).toHaveAttribute('href', '#participe');
  await expect(page.getByText('Acesso por convite. A gente chama você no WhatsApp.')).toBeVisible();
  await expect(page.getByRole('img', { name: /conversa com o bot da JornadaPet/ })).toBeVisible();
});

test('foto do hero carrega com prioridade e sem lazy', async ({ page }) => {
  await page.goto('/');
  const img = page.locator('#topo .hero-photo img');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  await expect(img).not.toHaveAttribute('loading', 'lazy');
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('título e foto nunca começam invisíveis', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['#topo h1', '#topo .hero-photo']) {
    expect(await page.locator(sel).evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  }
});

test('título em no máximo 3 linhas no desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'regra de desktop');
  await page.goto('/');
  const linhas = await page.locator('#topo h1').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
  expect(linhas).toBeLessThanOrEqual(3);
});
