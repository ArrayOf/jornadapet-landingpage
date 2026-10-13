import { expect, test } from './fixtures';

test('seções com conteúdo visível sem JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const t of ['O seu dia, aberto no Telegram.', 'Feito primeiro para adestradores de cães.', 'Passeadores e pet sitters', 'O que estamos estudando.', 'Uma empresa pequena, que prefere ouvir antes de vender.', 'Mario Guedes', 'Thiago Filadelfo']) {
    await expect(page.getByText(t).first()).toBeVisible();
  }
  await ctx.close();
});

test('nada da revelação fica invisível', async ({ page }) => {
  await page.goto('/');
  const opacidades = await page.locator('[data-reveal]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
  expect(opacidades.length).toBeGreaterThan(0);
  for (const o of opacidades) expect(o).toBe('1');
});

test('sócios levam ao LinkedIn em nova aba', async ({ page }) => {
  await page.goto('/');
  const mario = page.locator('#sobre').getByRole('link', { name: /Mario Guedes/ });
  await expect(mario).toHaveAttribute('href', 'https://www.linkedin.com/in/jmarioguedes/');
  await expect(mario).toHaveAttribute('target', '_blank');
  await expect(mario).toHaveAttribute('rel', /noopener/);
});

test('sem títulos de nível 3 dentro dos exemplos de interface', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('#como-funciona h3, .previa h3').count()).toBe(0);
});

test('selo redondo aparece no Sobre com pelo menos 96px (NT-002 §7), um por tema', async ({ page }) => {
  await page.goto('/#sobre');
  const selo = page.locator('#sobre').getByRole('img', { name: /JornadaPet, do adestrador/ });
  await expect(selo).toHaveCount(1);
  const caixa = await selo.boundingBox();
  expect(caixa!.width).toBeGreaterThanOrEqual(96);
});
