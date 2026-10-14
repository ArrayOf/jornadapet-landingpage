/**
 * Turnstile carregado só perto do formulário (plano de desempenho, 13/10/2026). Fixo no HTML, ele baixava
 * cerca de 700 KB logo no início e atrasava a pintura do hero no celular.
 */
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=jpTurnstilePronto';

interface ApiTurnstile { render(caixa: HTMLElement, opcoes: Record<string, string>): string }
type JanelaComTurnstile = Window & { turnstile?: ApiTurnstile; jpTurnstilePronto?: () => void };

let pedido = false;

/** Injeta o script uma vez e desenha o widget na caixa quando ele chegar. */
export function carregarTurnstile(caixa: HTMLElement | undefined): void {
  if (pedido || !caixa) return;
  pedido = true;
  const janela = window as JanelaComTurnstile;
  janela.jpTurnstilePronto = () => {
    janela.turnstile?.render(caixa, {
      sitekey: caixa.dataset.sitekey ?? '', appearance: 'interaction-only', size: 'flexible', theme: 'auto', language: 'pt-br',
    });
  };
  const s = document.createElement('script');
  s.src = SCRIPT;
  s.async = true;
  document.head.append(s);
}

/** Carrega quando o formulário chega a 800 px da tela ou quando recebe foco, o que vier primeiro. */
export function vigiarTurnstile(formulario: HTMLElement, caixa: HTMLElement | undefined): void {
  const carregar = () => carregarTurnstile(caixa);
  formulario.addEventListener('focusin', carregar, { once: true });
  if (!('IntersectionObserver' in window)) { carregar(); return; }
  const obs = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) { obs.disconnect(); carregar(); }
  }, { rootMargin: '800px 0px' });
  obs.observe(formulario);
}

/**
 * Token do widget. Se a pessoa enviar antes de o Turnstile chegar, garante o pedido do script e espera
 * o token (até o limite); vazio no fim, o servidor recusa e a tela mostra o erro de envio.
 */
export async function esperarToken(raiz: HTMLElement, caixa: HTMLElement | undefined, limiteMs = 15000): Promise<string> {
  const ler = () => raiz.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? '';
  carregarTurnstile(caixa);
  const fim = Date.now() + limiteMs;
  let token = ler();
  while (!token && Date.now() < fim) {
    await new Promise((ok) => setTimeout(ok, 100));
    token = ler();
  }
  return token;
}

