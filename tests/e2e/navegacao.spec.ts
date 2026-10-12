import { expect, test } from '@playwright/test';

test.describe('celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'só no celular');

  test('menu abre, prende o foco, fecha com Esc e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/');
    const botao = page.getByRole('button', { name: 'Abrir menu' });
    await botao.click();
    const menu = page.locator('#menu-mobile');
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(await menu.evaluate((m) => m.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
  });

  test('link do menu fecha o menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.locator('#menu-mobile').getByRole('link', { name: 'Sobre' }).click();
    await expect(page.locator('#menu-mobile')).toBeHidden();
  });
});

test('rodapé tem endosso da ArrayOf, e-mail visível e link para a política', async ({ page }) => {
  await page.goto('/');
  const rodape = page.locator('footer');
  await expect(rodape.getByText('JornadaPet é um produto da')).toBeVisible();
  await expect(rodape.getByRole('link', { name: 'ArrayOf' })).toHaveAttribute('href', 'https://arrayof.com.br');
  await expect(rodape.getByText('contato@jornadapet.com.br')).toBeVisible();
  await expect(rodape.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute('href', '/privacidade');
});

test('o símbolo é SVG próprio, sem fonte de ícones', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header svg[data-simbolo]')).toHaveCount(1);
  expect(await page.locator('link[href*="phosphor"], .ph').count()).toBe(0);
});
