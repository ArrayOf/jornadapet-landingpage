import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const tema of ['light', 'dark'] as const) {
  test(`sem violações de acessibilidade (${tema})`, async ({ page }) => {
    // Mede o estado de repouso: sem entrada animada e sem troca automática do passo a passo no meio da medição.
    await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
    await page.goto('/');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('com reduzir movimento nada anima', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('com reduzir transparência o vidro fica sólido', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.documentElement.classList.add('solid'));
  expect(await page.locator('.glass').first().evaluate((e) => getComputedStyle(e).backdropFilter)).toBe('none');
});

test('nenhum travessão em texto visível', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('body').innerText()).not.toMatch(/[—–]/);
});

test('um h1 só, e títulos sem saltos', async ({ page }) => {
  await page.goto('/');
  const niveis = await page.locator('h1, h2, h3, h4').evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
  expect(niveis.filter((n) => n === 1)).toHaveLength(1);
  for (let i = 1; i < niveis.length; i++) expect(niveis[i] - niveis[i - 1]).toBeLessThanOrEqual(1);
});
