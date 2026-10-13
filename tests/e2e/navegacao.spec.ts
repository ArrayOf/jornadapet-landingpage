import { expect, test } from './fixtures';

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

test('o topo mostra o selo redondo (NT-002) com 42px, sem fonte de ícones', async ({ page }) => {
  await page.goto('/');
  const selo = page.locator('header img[data-selo]:visible');
  await expect(selo).toHaveCount(1);
  await expect(selo).toHaveAttribute('alt', '');
  expect(await selo.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  expect((await selo.boundingBox())!.width).toBeGreaterThanOrEqual(42);
  await expect(page.locator('header img[data-simbolo]')).toHaveCount(0);
  expect(await page.locator('link[href*="phosphor"], .ph, svg[data-simbolo]').count()).toBe(0);
});

test('fora da página inicial, "Quero meu convite" leva ao formulário da página inicial', async ({ page, isMobile }) => {
  await page.goto('/privacidade');
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.locator('#menu-mobile').getByRole('link', { name: 'Quero meu convite' }).click();
  } else {
    await page.locator('header').getByRole('link', { name: 'Quero meu convite' }).click();
  }
  await expect(page).toHaveURL(/\/#participe$/);
  await expect(page.locator('#participe form')).toBeVisible();
});

test('o rodapé também mostra o selo redondo, como o topo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer img[data-selo]:visible')).toHaveCount(1);
  await expect(page.locator('footer img[data-simbolo]')).toHaveCount(0);
});
