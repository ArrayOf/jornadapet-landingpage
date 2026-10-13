import { describe, expect, it, vi } from 'vitest';
import { tratarConvite, type Ambiente } from '../../src/worker/convite';
import { TEXTO_DO_ACEITE } from '../../src/lib/formulario';

const SITE = 'https://site.test';
const VERIFICA = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SUPABASE = 'https://proj.supabase.co/rest/v1/convites';
const TELEGRAM = 'https://api.telegram.org/bottg-token/sendMessage';
const BUSCA = 'https://proj.supabase.co/rest/v1/convites?select=nome,cidade&codigo_indicacao=eq.k7m2pq9x&limit=1';

const liberado = { limit: vi.fn(async () => ({ success: true })) };
const env: Ambiente = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_abc', TURNSTILE_SECRET_KEY: 'ts_secret', LIMITE_CONVITE: liberado };
const valido = { nome: '  Camila Duarte ', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: ' Campinas, SP ', aceite: 'sim', pagina: '/', utm_source: 'instagram', ref: 'marcos', 'cf-turnstile-response': 'token-ok' };

const CAB = { 'Content-Type': 'application/json', Accept: 'application/json', Origin: SITE, 'CF-Connecting-IP': '203.0.113.7' };
const json = (corpo: unknown, cab: Record<string, string> = CAB) => new Request(`${SITE}/api/convite`, { method: 'POST', headers: cab, body: JSON.stringify(corpo) });

/** Simula o Turnstile e o Supabase. */
function servicos({ turnstile = true, supabase = 201, corpoSupabase = '', telegram = 200, indicador = null as { nome: string; cidade: string } | null | 'erro' } = {}) {
  return vi.fn(async (url: string, _init?: RequestInit) => {
    if (url === VERIFICA) return Response.json({ success: turnstile });
    if (url === SUPABASE) return new Response(corpoSupabase || null, { status: supabase });
    if (url === TELEGRAM) return Response.json({ ok: telegram === 200 }, { status: telegram });
    if (url === BUSCA) return indicador === 'erro' ? new Response('', { status: 500 }) : Response.json(indicador ? [indicador] : []);
    throw new Error(`URL inesperada: ${url}`);
  });
}
type Chamada = [string, RequestInit];
const chamadas = (f: ReturnType<typeof servicos>, url: string) => (f.mock.calls as unknown as Chamada[]).filter(([u]) => u === url);
const linhaGravada = (f: ReturnType<typeof servicos>) => JSON.parse(chamadas(f, SUPABASE)[0][1].body as string);
const tratar = (req: Request, f: ReturnType<typeof servicos>, e: Ambiente = env) => tratarConvite(req, e, f as unknown as typeof fetch);

describe('tratarConvite: gravação', () => {
  it('grava a linha normalizada no Supabase e responde success: true', async () => {
    const f = servicos();
    const r = await tratar(json(valido), f);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true });
    const [, init] = chamadas(f, SUPABASE)[0];
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ apikey: 'sb_secret_abc', Prefer: 'return=minimal', 'Content-Type': 'application/json' });
    expect(linhaGravada(f)).toEqual({
      nome: 'Camila Duarte', whatsapp: '19998761234', perfil: 'Adestramento', cidade: 'Campinas, SP',
      aceite_texto: TEXTO_DO_ACEITE, pagina: '/', utm_source: 'instagram', ref: 'marcos',
    });
  });

  it('o texto do aceite gravado é o do servidor, não o que vier no envio', async () => {
    const f = servicos();
    await tratar(json({ ...valido, aceite_texto: 'qualquer coisa' }), f);
    expect(linhaGravada(f).aceite_texto).toBe(TEXTO_DO_ACEITE);
  });

  it('chave service_role antiga (JWT) vai também no Authorization', async () => {
    const f = servicos();
    await tratar(json(valido), f, { ...env, SUPABASE_SECRET_KEY: 'eyJhbGciOi.x.y' });
    expect(chamadas(f, SUPABASE)[0][1].headers).toMatchObject({ apikey: 'eyJhbGciOi.x.y', Authorization: 'Bearer eyJhbGciOi.x.y' });
  });

  it('origem é cortada em 100 caracteres e chaves desconhecidas são ignoradas', async () => {
    const f = servicos();
    await tratar(json({ ...valido, utm_campaign: 'x'.repeat(300), id: 99, criado_em: '2000-01-01', dia: '2000-01-01' }), f);
    const linha = linhaGravada(f);
    expect(linha.utm_campaign).toHaveLength(100);
    for (const k of ['id', 'criado_em', 'dia', 'cf-turnstile-response']) expect(linha).not.toHaveProperty(k);
  });

  it('mesmo WhatsApp no mesmo dia (conflito no banco): responde sucesso sem erro', async () => {
    const f = servicos({ supabase: 409, corpoSupabase: '{"code":"23505","message":"duplicate key value violates unique constraint \\"convites_whatsapp_por_dia\\""}' });
    const r = await tratar(json(valido), f);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true });
  });
});

describe('tratarConvite: proteção contra robôs', () => {
  it('sem Origin: 403 e nada verificado nem gravado', async () => {
    const f = servicos();
    const { Origin: _sem, ...semOrigem } = CAB;
    const r = await tratar(json(valido, semOrigem), f);
    expect(r.status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it('Origin de outro site: 403', async () => {
    const f = servicos();
    expect((await tratar(json(valido, { ...CAB, Origin: 'https://malicioso.example' }), f)).status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it('acima do limite por IP: 429, limite contado pelo IP e nada gravado', async () => {
    const f = servicos();
    const estourado = { limit: vi.fn(async () => ({ success: false })) };
    const r = await tratar(json(valido), f, { ...env, LIMITE_CONVITE: estourado });
    expect(r.status).toBe(429);
    expect(estourado.limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
    expect(f).not.toHaveBeenCalled();
  });

  it('Turnstile verificado com a chave secreta, o token e o IP', async () => {
    const f = servicos();
    await tratar(json(valido), f);
    const [, init] = chamadas(f, VERIFICA)[0];
    const corpo = init.body as FormData;
    expect(corpo.get('secret')).toBe('ts_secret');
    expect(corpo.get('response')).toBe('token-ok');
    expect(corpo.get('remoteip')).toBe('203.0.113.7');
  });

  it('Turnstile recusado: 403 com código turnstile e nada gravado', async () => {
    const f = servicos({ turnstile: false });
    const r = await tratar(json(valido), f);
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ success: false, codigo: 'turnstile' });
    expect(chamadas(f, SUPABASE)).toHaveLength(0);
  });

  it('sem token do Turnstile: 403 sem nem consultar o Cloudflare', async () => {
    const f = servicos();
    const { 'cf-turnstile-response': _sem, ...semToken } = valido;
    expect((await tratar(json(semToken), f)).status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it('isca preenchida: finge sucesso e não grava', async () => {
    const f = servicos();
    const r = await tratar(json({ ...valido, botcheck: 'on' }), f);
    expect(await r.json()).toEqual({ success: true });
    expect(chamadas(f, SUPABASE)).toHaveLength(0);
  });

  it('envio de formulário comum (sem JS) não tem token: vai para /nao-enviado', async () => {
    const f = servicos();
    const { 'cf-turnstile-response': _sem, ...semToken } = valido;
    const req = new Request(`${SITE}/api/convite`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: SITE }, body: new URLSearchParams(semToken).toString() });
    const r = await tratar(req, f);
    expect(r.status).toBe(303);
    expect(r.headers.get('Location')).toBe('/nao-enviado');
    expect(chamadas(f, SUPABASE)).toHaveLength(0);
  });
});

describe('tratarConvite: entradas inválidas e falhas', () => {
  it('dados inválidos: 400 com os erros e nada gravado', async () => {
    const f = servicos();
    const r = await tratar(json({ ...valido, whatsapp: '98765-4321', perfil: 'Astronauta' }), f);
    expect(r.status).toBe(400);
    const corpo = (await r.json()) as { success: boolean; erros: Record<string, string> };
    expect(corpo.success).toBe(false);
    expect(Object.keys(corpo.erros).sort()).toEqual(['perfil', 'whatsapp']);
    expect(chamadas(f, SUPABASE)).toHaveLength(0);
  });

  it('sem aceite não grava', async () => {
    const f = servicos();
    const { aceite: _sem, ...semAceite } = valido;
    expect((await tratar(json(semAceite), f)).status).toBe(400);
    expect(chamadas(f, SUPABASE)).toHaveLength(0);
  });

  it('Supabase falhando: 502 com só o código do erro', async () => {
    const f = servicos({ supabase: 401, corpoSupabase: '{"code":"42501","message":"permission denied for table convites"}' });
    const r = await tratar(json(valido), f);
    expect(r.status).toBe(502);
    // Só o código do Supabase, para diagnóstico; nunca a mensagem nem a chave.
    expect(await r.json()).toEqual({ success: false, codigo: '401/42501' });
  });

  it('rede caindo também é erro, não exceção', async () => {
    const caiu = vi.fn(async (url: string) => {
      if (url === VERIFICA) return Response.json({ success: true });
      throw new TypeError('fetch failed');
    });
    expect((await tratarConvite(json(valido), env, caiu as unknown as typeof fetch)).status).toBe(502);
  });

  it('sem configuração (Supabase ou Turnstile): 500 e nada gravado', async () => {
    for (const faltando of [{ SUPABASE_URL: '' }, { SUPABASE_SECRET_KEY: '' }, { TURNSTILE_SECRET_KEY: '' }]) {
      const f = servicos();
      expect((await tratar(json(valido), f, { ...env, ...faltando })).status).toBe(500);
      expect(chamadas(f, SUPABASE)).toHaveLength(0);
    }
  });

  it('só aceita POST', async () => {
    const r = await tratar(new Request(`${SITE}/api/convite`), servicos());
    expect(r.status).toBe(405);
    expect(r.headers.get('Allow')).toBe('POST');
  });

  it('corpo inválido ou grande demais: 400/413 sem gravar', async () => {
    const f = servicos();
    const quebrado = new Request(`${SITE}/api/convite`, { method: 'POST', headers: CAB, body: '{nao é json' });
    expect((await tratar(quebrado, f)).status).toBe(400);
    expect((await tratar(json({ ...valido, nome: 'a'.repeat(20_000) }), f)).status).toBe(413);
    expect(chamadas(f, SUPABASE)).toHaveLength(0);
  });
});

describe('tratarConvite: aviso no Telegram', () => {
  const comTelegram: Ambiente = { ...env, TELEGRAM_BOT_TOKEN: 'tg-token', TELEGRAM_CHAT_ID: '-100123' };
  /** Coleta o que o Worker deixaria rodando depois da resposta (ctx.waitUntil). */
  function depois() {
    const pendentes: Promise<unknown>[] = [];
    return { aguardar: (p: Promise<unknown>) => { pendentes.push(p); }, terminar: () => Promise.all(pendentes) };
  }

  it('pedido gravado: avisa o grupo com os dados e o link do WhatsApp, sem atrasar a resposta', async () => {
    const f = servicos();
    const d = depois();
    const r = await tratarConvite(json(valido), comTelegram, f as unknown as typeof fetch, d.aguardar);
    expect(await r.json()).toEqual({ success: true });
    await d.terminar();
    const [, init] = chamadas(f, TELEGRAM)[0];
    const corpo = JSON.parse(init.body as string) as { chat_id: string; text: string; disable_web_page_preview: boolean };
    expect(corpo.chat_id).toBe('-100123');
    expect(corpo.disable_web_page_preview).toBe(true);
    for (const trecho of ['Novo pedido de convite', 'Camila Duarte', '(19) 99876-1234', 'https://wa.me/5519998761234', 'Adestramento', 'Campinas, SP', 'utm_source: instagram', 'ref: marcos']) {
      expect(corpo.text).toContain(trecho);
    }
    expect(corpo.text).not.toContain('—');
  });

  it('Telegram falhando não muda a resposta para quem enviou', async () => {
    const f = servicos({ telegram: 500 });
    const d = depois();
    const r = await tratarConvite(json(valido), comTelegram, f as unknown as typeof fetch, d.aguardar);
    expect(await r.json()).toEqual({ success: true });
    await expect(d.terminar()).resolves.toBeDefined();
  });

  // O duplicado do dia passou a avisar como reenvio (revisão final, 'Errou algum dado?').
  it('isca e falha no Supabase não avisam', async () => {
    for (const [corpo, opcoes] of [[{ ...valido, botcheck: 'on' }, {}], [valido, { supabase: 500 }]] as const) {
      const f = servicos(opcoes);
      const d = depois();
      await tratarConvite(json(corpo), comTelegram, f as unknown as typeof fetch, d.aguardar);
      await d.terminar();
      expect(chamadas(f, TELEGRAM)).toHaveLength(0);
    }
  });

  it('espaços ou quebra de linha colados no token e no chat são ignorados', async () => {
    const f = servicos();
    const d = depois();
    await tratarConvite(json(valido), { ...env, TELEGRAM_BOT_TOKEN: ' tg-token\n', TELEGRAM_CHAT_ID: ' -100123 ' }, f as unknown as typeof fetch, d.aguardar);
    await d.terminar();
    const [, init] = chamadas(f, TELEGRAM)[0];
    expect(JSON.parse(init.body as string).chat_id).toBe('-100123');
  });

  it('sem token ou chat configurado, só grava (aviso é opcional)', async () => {
    const f = servicos();
    const d = depois();
    expect((await tratarConvite(json(valido), env, f as unknown as typeof fetch, d.aguardar)).status).toBe(200);
    await d.terminar();
    expect(chamadas(f, TELEGRAM)).toHaveLength(0);
    expect(chamadas(f, SUPABASE)).toHaveLength(1);
  });
});

describe('tratarConvite: indicação', () => {
  const comTelegram = { ...env, TELEGRAM_BOT_TOKEN: 'tg-token', TELEGRAM_CHAT_ID: '-100123' };
  async function avisoDe(corpo: object, indicador: { nome: string; cidade: string } | null | 'erro') {
    const f = servicos({ indicador });
    const pendentes: Promise<unknown>[] = [];
    await tratarConvite(json(corpo), comTelegram, f as unknown as typeof fetch, (p) => { pendentes.push(p); });
    await Promise.all(pendentes);
    return { f, texto: JSON.parse(chamadas(f, TELEGRAM)[0][1].body as string).text as string };
  }

  it('grava o código válido e ignora o inválido sem recusar', async () => {
    const f = servicos();
    await tratar(json({ ...valido, codigo_indicacao: 'k7m2pq9x' }), f);
    expect(linhaGravada(f).codigo_indicacao).toBe('k7m2pq9x');
    const g = servicos();
    expect((await tratar(json({ ...valido, codigo_indicacao: "x'; drop" }), g)).status).toBe(200);
    expect(linhaGravada(g)).not.toHaveProperty('codigo_indicacao');
  });

  it('409 do mesmo WhatsApp no dia é sucesso; outro conflito é erro', async () => {
    const dia = servicos({ supabase: 409, corpoSupabase: '{"code":"23505","message":"duplicate key value violates unique constraint \\"convites_whatsapp_por_dia\\""}' });
    expect(await (await tratar(json(valido), dia)).json()).toEqual({ success: true });
    const outro = servicos({ supabase: 409, corpoSupabase: '{"code":"23505","message":"duplicate key value violates unique constraint \\"outro_indice\\""}' });
    const r = await tratar(json(valido), outro);
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ success: false, codigo: '409/23505' });
  });

  it('aviso traz o nome e a cidade de quem indicou', async () => {
    const { texto } = await avisoDe({ ...valido, ref: 'k7m2pq9x' }, { nome: 'Camila Duarte', cidade: 'Campinas, SP' });
    expect(texto).toContain('Indicação de Camila Duarte (Campinas, SP)');
    expect(texto).not.toContain('ref: k7m2pq9x');
  });

  it('sem quem indicou, ou com erro na busca, cai no código', async () => {
    for (const indicador of [null, 'erro'] as const) {
      const { texto } = await avisoDe({ ...valido, ref: 'k7m2pq9x' }, indicador);
      expect(texto).toContain('Indicação: código k7m2pq9x');
    }
  });

  it('ref que não é código não dispara busca', async () => {
    const { f, texto } = await avisoDe({ ...valido, ref: 'marcos' }, null);
    expect(chamadas(f, BUSCA)).toHaveLength(0);
    expect(texto).toContain('ref: marcos');
  });
});

describe('tratarConvite: revisão final', () => {
  const comTelegram = { ...env, TELEGRAM_BOT_TOKEN: 'tg-token', TELEGRAM_CHAT_ID: '-100123' };

  it('reenvio do mesmo WhatsApp no dia: responde sucesso e avisa o grupo com os dados novos, marcado como reenvio', async () => {
    const f = servicos({ supabase: 409, corpoSupabase: '{"code":"23505","message":"duplicate key value violates unique constraint \\"convites_whatsapp_por_dia\\""}' });
    const pendentes: Promise<unknown>[] = [];
    const r = await tratarConvite(json({ ...valido, nome: 'Camila Duarte Souza', cidade: 'Valinhos, SP' }), comTelegram, f as unknown as typeof fetch, (p) => { pendentes.push(p); });
    expect(await r.json()).toEqual({ success: true });
    await Promise.all(pendentes);
    const texto = JSON.parse(chamadas(f, TELEGRAM)[0][1].body as string).text as string;
    expect(texto).toContain('Reenvio do mesmo WhatsApp hoje');
    expect(texto).toContain('Camila Duarte Souza');
    expect(texto).toContain('Valinhos, SP');
  });

  it('banco ainda sem a coluna codigo_indicacao (SQL 003 não aplicado): grava o pedido sem o código', async () => {
    let tentativa = 0;
    const corpos: Record<string, string>[] = [];
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === VERIFICA) return Response.json({ success: true });
      if (url === SUPABASE) {
        corpos.push(JSON.parse(init?.body as string));
        return tentativa++ === 0
          ? new Response('{"code":"PGRST204","message":"Could not find the \'codigo_indicacao\' column of \'convites\' in the schema cache"}', { status: 400 })
          : new Response(null, { status: 201 });
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    const r = await tratarConvite(json({ ...valido, codigo_indicacao: 'k7m2pq9x' }), env, f as unknown as typeof fetch);
    expect(r.status).toBe(200);
    expect(corpos).toHaveLength(2);
    expect(corpos[0].codigo_indicacao).toBe('k7m2pq9x');
    expect(corpos[1]).not.toHaveProperty('codigo_indicacao');
    expect(corpos[1].nome).toBe('Camila Duarte');
  });
});

