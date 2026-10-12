import { describe, expect, it, vi } from 'vitest';
import { tratarConvite, type Ambiente } from '../../src/worker/convite';
import { TEXTO_DO_ACEITE } from '../../src/lib/formulario';

const env: Ambiente = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_abc' };
const valido = { nome: '  Camila Duarte ', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: ' Campinas, SP ', aceite: 'sim', pagina: '/', utm_source: 'instagram', ref: 'marcos' };

const json = (corpo: unknown) => new Request('https://site/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corpo) });
const form = (corpo: Record<string, string>) => new Request('https://site/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(corpo).toString() });
const supabaseOk = () => vi.fn(async () => new Response(null, { status: 201 }));

describe('tratarConvite', () => {
  it('grava a linha normalizada no Supabase e responde success: true', async () => {
    const f = supabaseOk();
    const r = await tratarConvite(json(valido), env, f as unknown as typeof fetch);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://proj.supabase.co/rest/v1/convites');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ apikey: 'sb_secret_abc', Prefer: 'return=minimal', 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      nome: 'Camila Duarte', whatsapp: '19998761234', perfil: 'Adestramento', cidade: 'Campinas, SP',
      aceite_texto: TEXTO_DO_ACEITE, pagina: '/', utm_source: 'instagram', ref: 'marcos',
    });
  });

  it('o texto do aceite gravado é o do servidor, não o que vier no envio', async () => {
    const f = supabaseOk();
    await tratarConvite(json({ ...valido, aceite_texto: 'qualquer coisa' }), env, f as unknown as typeof fetch);
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).aceite_texto).toBe(TEXTO_DO_ACEITE);
  });

  it('chave service_role antiga (JWT) vai também no Authorization', async () => {
    const f = supabaseOk();
    await tratarConvite(json(valido), { ...env, SUPABASE_SECRET_KEY: 'eyJhbGciOi.x.y' }, f as unknown as typeof fetch);
    expect((f.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toMatchObject({ apikey: 'eyJhbGciOi.x.y', Authorization: 'Bearer eyJhbGciOi.x.y' });
  });

  it('sem JS (formulário comum) grava e redireciona para /obrigado', async () => {
    const f = supabaseOk();
    const r = await tratarConvite(form(valido), env, f as unknown as typeof fetch);
    expect(r.status).toBe(303);
    expect(r.headers.get('Location')).toBe('/obrigado');
    expect(f).toHaveBeenCalledOnce();
  });

  it('dados inválidos: 400 com os erros e nada gravado', async () => {
    const f = supabaseOk();
    const r = await tratarConvite(json({ ...valido, whatsapp: '98765-4321', perfil: 'Astronauta' }), env, f as unknown as typeof fetch);
    expect(r.status).toBe(400);
    const corpo = (await r.json()) as { success: boolean; erros: Record<string, string> };
    expect(corpo.success).toBe(false);
    expect(Object.keys(corpo.erros).sort()).toEqual(['perfil', 'whatsapp']);
    expect(f).not.toHaveBeenCalled();
  });

  it('sem aceite não grava', async () => {
    const f = supabaseOk();
    const { aceite: _sem, ...semAceite } = valido;
    expect((await tratarConvite(json(semAceite), env, f as unknown as typeof fetch)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('isca preenchida: finge sucesso e não grava', async () => {
    const f = supabaseOk();
    const r = await tratarConvite(json({ ...valido, botcheck: 'on' }), env, f as unknown as typeof fetch);
    expect(await r.json()).toEqual({ success: true });
    expect(f).not.toHaveBeenCalled();
  });

  it('origem é cortada em 100 caracteres e chaves desconhecidas são ignoradas', async () => {
    const f = supabaseOk();
    await tratarConvite(json({ ...valido, utm_campaign: 'x'.repeat(300), id: 99, criado_em: '2000-01-01' }), env, f as unknown as typeof fetch);
    const linha = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(linha.utm_campaign).toHaveLength(100);
    expect(linha).not.toHaveProperty('id');
    expect(linha).not.toHaveProperty('criado_em');
  });

  it('Supabase falhando: 502 success false (JSON) ou página de falha (sem JS)', async () => {
    const falha = vi.fn(async () => new Response('{"code":"42501","message":"permission denied for table convites"}', { status: 401 }));
    const r1 = await tratarConvite(json(valido), env, falha as unknown as typeof fetch);
    expect(r1.status).toBe(502);
    // Só o código do Supabase, para diagnóstico; nunca a mensagem nem a chave.
    expect(await r1.json()).toEqual({ success: false, codigo: '401/42501' });
    const r2 = await tratarConvite(form(valido), env, falha as unknown as typeof fetch);
    expect(r2.status).toBe(303);
    expect(r2.headers.get('Location')).toBe('/nao-enviado');
  });

  it('rede caindo também é erro, não exceção', async () => {
    const caiu = vi.fn(async () => { throw new TypeError('fetch failed'); });
    expect((await tratarConvite(json(valido), env, caiu as unknown as typeof fetch)).status).toBe(502);
  });

  it('sem configuração do Supabase: 500 e nada gravado', async () => {
    const f = supabaseOk();
    const r = await tratarConvite(json(valido), { SUPABASE_URL: '', SUPABASE_SECRET_KEY: '' }, f as unknown as typeof fetch);
    expect(r.status).toBe(500);
    expect(f).not.toHaveBeenCalled();
  });

  it('só aceita POST', async () => {
    const r = await tratarConvite(new Request('https://site/api/convite'), env, supabaseOk() as unknown as typeof fetch);
    expect(r.status).toBe(405);
    expect(r.headers.get('Allow')).toBe('POST');
  });

  it('corpo inválido ou grande demais: 400/413 sem gravar', async () => {
    const f = supabaseOk();
    const quebrado = new Request('https://site/api/convite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nao é json' });
    expect((await tratarConvite(quebrado, env, f as unknown as typeof fetch)).status).toBe(400);
    const grande = json({ ...valido, nome: 'a'.repeat(20_000) });
    expect((await tratarConvite(grande, env, f as unknown as typeof fetch)).status).toBe(413);
    expect(f).not.toHaveBeenCalled();
  });
});
