import type { Dados } from './validacao';
import type { Origem } from './utm';
import { mascararWhatsapp } from './whatsapp';

export const TEXTO_DO_ACEITE = 'Aceito ser contatado(a) pela JornadaPet sobre o teste. Meus dados não serão compartilhados.';

export interface Config { chave: string; urlObrigado: string }

export function montarEnvio(dados: Dados, origem: Origem, config: Config): Record<string, string> {
  return {
    access_key: config.chave,
    subject: 'Novo pedido de convite: JornadaPet',
    from_name: 'Landing JornadaPet',
    nome: dados.nome.trim(),
    whatsapp: mascararWhatsapp(dados.whatsapp),
    perfil: dados.perfil,
    cidade: dados.cidade.trim(),
    aceite: 'sim',
    aceite_texto: TEXTO_DO_ACEITE,
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
