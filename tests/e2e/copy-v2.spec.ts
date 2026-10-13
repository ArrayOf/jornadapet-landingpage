import { expect, test } from './fixtures';

const H1 = 'Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só.';

test('hero da copy v2', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1);
  const topo = page.locator('#topo');
  await expect(topo).toContainText('Em teste com adestradores');
  await expect(topo).toContainText('Tudo organizado no Telegram, no celular e no computador. Sem caderno, sem planilha, sem instalar outro app.');
  await expect(topo).not.toContainText(/\bbot\b/);
  await expect(page.getByRole('img', { name: 'Exemplo: conversa com a JornadaPet no Telegram, com o botão Abrir JornadaPet' })).toBeVisible();
});

test('botões pedem o convite; nenhum fala em testar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Quero testar' })).toHaveCount(0);
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero meu convite' })).toHaveAttribute('href', '#participe');
  await expect(page.locator('#como-funciona').getByRole('link', { name: 'Quero meu convite' })).toBeVisible();
  await expect(page.locator('#participe h2')).toHaveText('Peça seu convite.');
});

test('textos novos e removidos', async ({ page }) => {
  await page.goto('/');
  const corpo = page.locator('body');
  for (const novo of [
    'Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar.',
    'Veja o dia ou a semana, marque uma vez o horário fixo de cada cão e saiba quando dois horários se cruzam.',
    'Abra o Telegram e veja o dia inteiro: quem você atende, a que horas e quanto falta receber.',
    'Para o tutor, nada muda',
    'Fica na sua lista de conversas, como um contato. Não tem outro aplicativo para baixar.',
    'Feito primeiro para adestradores de cães.',
    'Estamos começando por quem trabalha sozinho e atende os mesmos cães toda semana.',
    'Aula em casa ou no parque, com horário fixo.',
    'Clientes, agenda e quem ainda falta pagar, dentro do Telegram.',
    'Preço e quais profissionais mais precisam disso.',
    'quando abrir a sua turma, envia o seu convite.',
    'A gente chama você no WhatsApp em até 3 dias úteis.',
    'nunca são vendidos',
    'Preciso baixar algum aplicativo? Funciona no iPhone e no Android?',
  ]) await expect(corpo).toContainText(novo);
  for (const velho of ['No celular e no computador', 'carteira recorrente', 'carteira de clientes recorrentes', 'canal certo', 'não são compartilhados', 'nos próximos dias', 'Em construção', 'Teste antes de todo mundo']) {
    await expect(corpo).not.toContainText(velho);
  }
});

test('/obrigado promete só o primeiro contato e cita as turmas', async ({ page }) => {
  await page.goto('/obrigado');
  await expect(page.locator('main')).toContainText('A gente chama você no WhatsApp em até 3 dias úteis para conversar. Os convites saem aos poucos, em turmas.');
});

test('title, description e og alinhados; og das outras páginas é da própria página', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Agenda, clientes e pagamentos para adestrador de cães | JornadaPet');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Organize clientes, agenda e quem ainda falta pagar no adestramento de cães, direto no Telegram, sem instalar outro app. Acesso por convite.');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'JornadaPet: clientes, agenda e pagamentos do adestrador');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', 'Clientes, agenda e quem ainda falta pagar, organizados no Telegram. Acesso por convite.');
  await page.goto('/privacidade');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Política de privacidade: JornadaPet');
});

test('h1 em até 3 linhas em 1024 e 1280; CTA do hero visível em 360x640', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mede larguras fixas');
  for (const largura of [1024, 1280]) {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto('/');
    const linhas = await page.locator('#topo h1').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
    expect(linhas, `${largura}px`).toBeLessThanOrEqual(3);
  }
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero meu convite' })).toBeInViewport();
});
