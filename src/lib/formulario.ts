import type { Dados } from './validacao';
import type { Origem } from './utm';
import { mascararWhatsapp } from './whatsapp';

/** Texto do aceite como aparece na tela; o servidor grava exatamente este texto como prova do consentimento. */
export const ACEITE_INICIO = 'Aceito ser contatado(a) pela JornadaPet pelo WhatsApp sobre o teste. Li a';
export const TEXTO_DO_ACEITE = `${ACEITE_INICIO} Política de privacidade.`;

/** Corpo do POST para /api/convite. O texto do aceite é gravado pelo servidor, não vem daqui. */
export function montarEnvio(dados: Dados, origem: Origem): Record<string, string> {
  return {
    nome: dados.nome.trim(),
    whatsapp: mascararWhatsapp(dados.whatsapp),
    perfil: dados.perfil,
    cidade: dados.cidade.trim(),
    aceite: 'sim',
    pagina: '/',
    ...origem,
  };
}

export type Resultado = 'ok' | 'erro';

export async function enviar(corpo: Record<string, string>, endpoint: string, fetchFn: typeof fetch = fetch, tempoMs = 15000): Promise<Resultado> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), tempoMs);
  try {
    const r = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    });
    if (!r.ok) return 'erro';
    const j: unknown = await r.json().catch(() => null);
    return typeof j === 'object' && j !== null && (j as { success?: unknown }).success === true ? 'ok' : 'erro';
  } catch {
    return 'erro';
  } finally {
    clearTimeout(t);
  }
}
