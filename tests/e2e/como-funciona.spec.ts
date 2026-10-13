import { expect, test } from './fixtures';

test('passos aparecem sem JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  const sec = page.locator('#como-funciona');
  for (const t of ['Tutores e pets com WhatsApp', 'Veja o dia ou a semana', 'Registre o valor combinado', 'Terça, 14 de outubro', 'Pacote de outubro, Thor']) {
    await expect(sec.getByText(t, { exact: false }).filter({ visible: true }).first()).toBeVisible();
  }
  await ctx.close();
});

test('setas trocam a aba, movem o foco e só um painel fica ativo', async ({ page }) => {
  await page.goto('/#como-funciona');
  const abas = page.getByRole('tab');
  await expect(abas).toHaveCount(3);
  await abas.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Agende' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Agende' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#painel-agende')).toHaveAttribute('data-on', 'true');
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('inert');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Acompanhe' })).toBeFocused();
});

test('no desktop troca sozinho e o botão pausa', async ({ page, isMobile }) => {
  test.skip(isMobile, 'troca automática só no desktop');
  await page.clock.install();
  await page.goto('/');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('data-on', 'true');
  await page.clock.runFor(6500);
  await expect(page.locator('#painel-agende')).toHaveAttribute('data-on', 'true');
  await page.getByRole('button', { name: 'Pausar a demonstração' }).click();
  await page.clock.runFor(13000);
  await expect(page.locator('#painel-agende')).toHaveAttribute('data-on', 'true');
});

test('no celular não troca sozinho', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'regra de celular');
  await page.clock.install();
  await page.goto('/');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.clock.runFor(13000);
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('data-on', 'true');
});

test('com reduzir movimento não troca sozinho', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.clock.runFor(13000);
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('data-on', 'true');
});

test('abaixo de 1024 px, o cartão do passo não cobre o texto nem sai do painel', async ({ browser }) => {
  for (const largura of [360, 412, 700, 900]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.route('https://challenges.cloudflare.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
    await page.locator('#como-funciona').scrollIntoViewIfNeeded();
    for (const aba of ['Cadastre', 'Agende', 'Acompanhe']) {
      await page.getByRole('tab', { name: aba }).click();
      const medidas = await page.evaluate(() => {
        const palco = document.querySelector('.palco')!.getBoundingClientRect();
        const texto = [...document.querySelectorAll('.palco > p')].find((p) => getComputedStyle(p).display !== 'none')!.getBoundingClientRect();
        const cartao = [...document.querySelectorAll('.stage-card')].find((c) => c.getAttribute('data-on') === 'true')!.getBoundingClientRect();
        return { textoFim: texto.bottom, cartaoInicio: cartao.top, cartaoFim: cartao.bottom, palcoFim: palco.bottom };
      });
      expect(medidas.cartaoInicio, `${largura}px ${aba}: cartão cobre o texto`).toBeGreaterThanOrEqual(medidas.textoFim);
      expect(medidas.cartaoFim, `${largura}px ${aba}: cartão sai do painel`).toBeLessThanOrEqual(medidas.palcoFim);
    }
    await ctx.close();
  }
});
