export const CHAVES_DE_ORIGEM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'] as const;
export type Origem = Partial<Record<(typeof CHAVES_DE_ORIGEM)[number], string>>;

const CHAVE_NO_STORAGE = 'jp-origem';

export function lerOrigem(search: string): Origem {
  const p = new URLSearchParams(search);
  const o: Origem = {};
  for (const k of CHAVES_DE_ORIGEM) {
    const v = p.get(k)?.trim();
    if (v) o[k] = v.slice(0, 100);
  }
  return o;
}

/** A origem da URL atual vence; sem ela, vale a guardada na sessão. Storage bloqueado não quebra nada. */
export function guardarOrigem(storage: Pick<Storage, 'getItem' | 'setItem'> | null, search: string): Origem {
  const atual = lerOrigem(search);
  try {
    if (Object.keys(atual).length > 0) {
      storage?.setItem(CHAVE_NO_STORAGE, JSON.stringify(atual));
      return atual;
    }
    const salvo = storage?.getItem(CHAVE_NO_STORAGE);
    if (!salvo) return atual;
    const lido: unknown = JSON.parse(salvo);
    return lerOrigem('?' + new URLSearchParams(lido as Record<string, string>).toString());
  } catch {
    return atual;
  }
}
