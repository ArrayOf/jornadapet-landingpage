import { expect, test } from './fixtures';

test('dúvidas abrem sem JS e a primeira já vem aberta', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/#perguntas');
  const itens = page.locator('#perguntas details');
  await expect(itens).toHaveCount(8);
  await expect(itens.first()).toHaveAttribute('open', '');
  await page.getByText('Como eu entro?').click();
  await expect(page.getByText('você confirma o celular por SMS uma única vez')).toBeVisible();
  await ctx.close();
});

test('abrir uma fecha a outra', async ({ page }) => {
  await page.goto('/#perguntas');
  await page.getByText('Preciso usar o Telegram?').click();
  await expect(page.locator('#perguntas details').first()).not.toHaveAttribute('open', '');
});
