import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

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

const APARELHOS = [[360, 740], [390, 844], [412, 915], [768, 1024], [820, 1180], [1024, 768], [1180, 820]] as const;

test('celular e tablet: sem rolagem lateral em nenhuma largura', async ({ browser }) => {
  for (const [w, h] of APARELHOS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true });
    const page = await ctx.newPage();
    await page.route('https://challenges.cloudflare.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
    for (const rota of ['/', '/privacidade']) {
      await page.goto(rota);
      // Reconfere por alguns instantes: sob carga, a medida no meio do carregamento oscilava; sobra que fica, reprova.
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${w}px ${rota}` }).toBeLessThanOrEqual(0);
    }
    await ctx.close();
  }
});

test('celular e tablet: links do menu e do rodapé com alvo de toque de 44 px', async ({ browser }) => {
  for (const [w, h] of APARELHOS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true });
    const page = await ctx.newPage();
    await page.route('https://challenges.cloudflare.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
    const pequenos = await page.evaluate(() => [...document.querySelectorAll('header nav ul a, footer a')]
      .filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height < 44 && !a.closest('p, span'); })
      .map((a) => `${(a.textContent || '').trim()} ${Math.round(a.getBoundingClientRect().height)}px`));
    expect(pequenos, `${w}px`).toEqual([]);
    await ctx.close();
  }
});
