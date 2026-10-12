import { expect, test } from '@playwright/test';

test('carrega em pt-BR, com fontes e sem erro no console', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
  await expect(page.locator('body')).toHaveCSS('font-family', /Instrument Sans Variable/);
  expect(erros).toEqual([]);
});

test('tema escuro do sistema aplica a classe dark e os tokens escuros', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(21, 22, 19)');
});

test('reduzir movimento aplica a classe rm', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\brm\b/);
});

test('fora de produção sai com noindex', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});
