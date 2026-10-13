import { digitosWhatsapp, whatsappValido } from './whatsapp';

/** a-z e 2-9 sem 0 o 1 l i: 31 símbolos, legíveis se alguém ditar o link (NT-004 §2). */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
export const REGEX_CODIGO = /^[a-hjkmnp-z2-9]{8}$/;
const CHAVE = 'jp-codigos';
const LIMITE = 256 - (256 % ALFABETO.length); // bytes a partir daqui enviesariam o sorteio

export function gerarCodigo(aleatorio: (b: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  let codigo = '';
  while (codigo.length < 8) {
    for (const byte of aleatorio(new Uint8Array(16))) {
      if (byte < LIMITE && codigo.length < 8) codigo += ALFABETO[byte % ALFABETO.length];
    }
  }
  return codigo;
}

export const codigoValido = (c: unknown): c is string => typeof c === 'string' && REGEX_CODIGO.test(c);

/** Um código por WhatsApp: o mesmo número reusa, outro ganha um novo (NT-004 §2). Storage bloqueado não quebra. */
export function codigoParaWhatsapp(storage: Pick<Storage, 'getItem' | 'setItem'> | null, whatsapp: string, gerar: () => string = gerarCodigo): string {
  const chave = digitosWhatsapp(whatsapp);
  let mapa: Record<string, string> = {};
  try {
    const lido: unknown = JSON.parse(storage?.getItem(CHAVE) ?? '{}');
    if (lido && typeof lido === 'object') mapa = lido as Record<string, string>;
  } catch { /* storage bloqueado ou mapa corrompido */ }
  if (codigoValido(mapa[chave])) return mapa[chave];
  const novo = gerar();
  try { storage?.setItem(CHAVE, JSON.stringify({ ...mapa, [chave]: novo })); } catch { /* storage bloqueado */ }
  return novo;
}

export const linkDeIndicacao = (origem: string, codigo: string, meio: 'whatsapp' | 'link') =>
  `${origem.replace(/\/+$/, '')}/?ref=${codigo}&utm_source=indicacao&utm_medium=${meio}`;

export const mensagemDeIndicacao = (link: string) =>
  `Pedi convite para testar a JornadaPet: organiza clientes, agenda e quem ainda falta pagar, tudo pelo Telegram. É feita para adestrador e não custa nada durante o teste. Pede o seu aqui: ${link}`;

export const linkCompartilharWhatsapp = (mensagem: string) => `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

export const linkWhatsappEmpresa = (numero: string): string | null =>
  whatsappValido(numero) ? `https://wa.me/55${digitosWhatsapp(numero)}` : null;
