/** Chave pública de teste do Cloudflare: o widget sempre passa (só para desenvolvimento e testes). */
export const CHAVE_DE_TESTE_DO_TURNSTILE = '1x00000000000000000000AA';

/** Chave pública do widget do Turnstile. Em produção (PUBLIC_INDEXAR=true), sem chave o build falha. */
export function chaveDoSiteTurnstile(valor: string | undefined, producao: boolean): string {
  const chave = (valor ?? '').trim();
  if (chave) return chave;
  if (producao) throw new Error('PUBLIC_TURNSTILE_SITE_KEY vazia: crie o widget do Turnstile e defina a chave antes de publicar.');
  return CHAVE_DE_TESTE_DO_TURNSTILE;
}
