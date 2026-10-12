import { describe, expect, it, vi } from 'vitest';
import { enviar, montarEnvio, TEXTO_DO_ACEITE } from '../../src/lib/formulario';

const dados = { nome: '  Camila Duarte ', whatsapp: '+55 19 99876-1234', perfil: 'Adestramento', cidade: ' Campinas, SP ', aceite: true };
const config = { chave: 'chave-x', urlObrigado: 'https://jornadapet.com.br/obrigado' };

describe('montarEnvio', () => {
  it('normaliza e inclui chave, aceite e origem', () => {
    expect(montarEnvio(dados, { utm_source: 'instagram' }, config)).toEqual({
      access_key: 'chave-x',
      subject: 'Novo pedido de convite: JornadaPet',
      from_name: 'Landing JornadaPet',
      nome: 'Camila Duarte',
      whatsapp: '(19) 99876-1234',
      perfil: 'Adestramento',
      cidade: 'Campinas, SP',
      aceite: 'sim',
      aceite_texto: TEXTO_DO_ACEITE,
      pagina: '/',
      utm_source: 'instagram',
    });
  });
});

function resposta(status: number, corpo: unknown) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }));
}

describe('enviar', () => {
  it('ok quando o serviço responde success: true', async () => {
    const f = vi.fn(() => resposta(200, { success: true }));
    expect(await enviar({ a: '1' }, 'https://x/submit', f as unknown as typeof fetch)).toBe('ok');
    expect(f).toHaveBeenCalledWith('https://x/submit', expect.objectContaining({ method: 'POST', body: '{"a":"1"}' }));
  });
  it.each([
    ['500', () => resposta(500, { success: false })],
    ['200 com success false', () => resposta(200, { success: false })],
    ['200 sem JSON', () => Promise.resolve(new Response('ok', { status: 200 }))],
    ['rede caindo', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('erro quando %s', async (_nome, impl) => {
    expect(await enviar({}, 'https://x', vi.fn(impl) as unknown as typeof fetch)).toBe('erro');
  });
  it('erro quando o serviço não responde dentro do tempo', async () => {
    const lento = vi.fn((_u: string, init?: RequestInit) => new Promise<Response>((_, rej) => {
      init?.signal?.addEventListener('abort', () => rej(new DOMException('abort', 'AbortError')));
    }));
    expect(await enviar({}, 'https://x', lento as unknown as typeof fetch, 20)).toBe('erro');
  });
});
