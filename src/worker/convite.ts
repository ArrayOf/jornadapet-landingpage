import { TEXTO_DO_ACEITE } from '../lib/formulario';
import { CHAVES_DE_ORIGEM } from '../lib/utm';
import { validar, type Dados } from '../lib/validacao';
import { digitosWhatsapp } from '../lib/whatsapp';

/** Binding de limite de envios do Cloudflare (ratelimits no wrangler.jsonc). */
export interface Limitador { limit(opcoes: { key: string }): Promise<{ success: boolean }> }

/** Configuração do Worker (vars no wrangler.jsonc; segredos em Settings → Variables and Secrets). */
export interface Ambiente {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  LIMITE_CONVITE?: Limitador;
}

const VERIFICA_TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const LIMITE_DO_CORPO = 10_000;

const json = (corpo: unknown, status = 200) => Response.json(corpo, { status });
const redirecionar = (para: string) => new Response(null, { status: 303, headers: { Location: para } });

async function lerCorpo(req: Request): Promise<Record<string, unknown> | null> {
  const tipo = req.headers.get('Content-Type') ?? '';
  try {
    if (tipo.includes('application/json')) {
      const j: unknown = JSON.parse(await req.text());
      return typeof j === 'object' && j !== null && !Array.isArray(j) ? (j as Record<string, unknown>) : null;
    }
    return Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return null;
  }
}

const texto = (v: unknown) => (typeof v === 'string' ? v : '');

/** Só aceita envio vindo da nossa própria página (o navegador sempre manda Origin num POST). */
function mesmaOrigem(req: Request): boolean {
  const origem = req.headers.get('Origin');
  return !!origem && origem === new URL(req.url).origin;
}

async function turnstileOk(token: string, env: Ambiente, ip: string, fetchFn: typeof fetch): Promise<boolean> {
  const corpo = new FormData();
  corpo.append('secret', env.TURNSTILE_SECRET_KEY);
  corpo.append('response', token);
  if (ip) corpo.append('remoteip', ip);
  try {
    const r = await fetchFn(VERIFICA_TURNSTILE, { method: 'POST', body: corpo });
    const j: unknown = await r.json().catch(() => null);
    return typeof j === 'object' && j !== null && (j as { success?: unknown }).success === true;
  } catch (e) {
    console.error('convite: falha ao verificar o Turnstile', e);
    return false;
  }
}

/** POST /api/convite: valida de novo no servidor e grava em public.convites no Supabase. */
export async function tratarConvite(req: Request, env: Ambiente, fetchFn: typeof fetch = fetch): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  // Envio por fetch (JS) pede JSON; o formulário comum (sem JS) espera redirecionamento.
  const querJson = (req.headers.get('Accept') ?? '').includes('application/json') || (req.headers.get('Content-Type') ?? '').includes('application/json');
  const falha = (status: number, extra: object = {}) => (querJson ? json({ success: false, ...extra }, status) : redirecionar('/nao-enviado'));

  // Camadas contra robôs, da mais barata para a mais cara: origem, limite por IP, isca, Turnstile.
  if (!mesmaOrigem(req)) return falha(403);
  const ip = req.headers.get('CF-Connecting-IP') ?? '';
  if (env.LIMITE_CONVITE && !(await env.LIMITE_CONVITE.limit({ key: ip || 'sem-ip' })).success) return falha(429);

  if (Number(req.headers.get('Content-Length') ?? 0) > LIMITE_DO_CORPO) return falha(413);
  const bruto = await lerCorpo(req);
  if (!bruto) return falha(400);
  if (JSON.stringify(bruto).length > LIMITE_DO_CORPO) return falha(413);

  // Isca para robôs: finge que deu certo e não grava.
  if (texto(bruto.botcheck)) return querJson ? json({ success: true }) : redirecionar('/obrigado');

  const dados: Dados = {
    nome: texto(bruto.nome), whatsapp: texto(bruto.whatsapp), perfil: texto(bruto.perfil), cidade: texto(bruto.cidade),
    aceite: bruto.aceite === true || bruto.aceite === 'sim' || bruto.aceite === 'on',
  };
  const erros = validar(dados);
  if (Object.keys(erros).length > 0) return falha(400, { erros });

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY || !env.TURNSTILE_SECRET_KEY) return falha(500);

  const token = texto(bruto['cf-turnstile-response']);
  if (!token || !(await turnstileOk(token, env, ip, fetchFn))) return falha(403, { codigo: 'turnstile' });

  const linha: Record<string, string> = {
    nome: dados.nome.trim(),
    whatsapp: digitosWhatsapp(dados.whatsapp),
    perfil: dados.perfil,
    cidade: dados.cidade.trim(),
    aceite_texto: TEXTO_DO_ACEITE,
    pagina: texto(bruto.pagina).slice(0, 100) || '/',
  };
  for (const k of CHAVES_DE_ORIGEM) {
    const v = texto(bruto[k]).trim();
    if (v) linha[k] = v.slice(0, 100);
  }

  const chave = env.SUPABASE_SECRET_KEY;
  const cabecalhos: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  // Chave nova (sb_secret_) vai só no apikey; a service_role antiga é um JWT e vai também no Authorization.
  if (!chave.startsWith('sb_')) cabecalhos.Authorization = `Bearer ${chave}`;

  try {
    const r = await fetchFn(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/convites`, { method: 'POST', headers: cabecalhos, body: JSON.stringify(linha) });
    // Mesmo WhatsApp no mesmo dia: o índice único do banco recusa; para quem envia, deu certo.
    if (r.status === 409) return querJson ? json({ success: true }) : redirecionar('/obrigado');
    if (!r.ok) {
      const detalhe = await r.text().catch(() => '');
      console.error('convite: Supabase respondeu', r.status, detalhe);
      // Só o status e o código do Postgres/PostgREST (ex.: 401/42501), para diagnóstico; nunca a mensagem.
      let codigo = '';
      try { codigo = String((JSON.parse(detalhe) as { code?: unknown }).code ?? ''); } catch { /* corpo sem JSON */ }
      return falha(502, { codigo: codigo ? `${r.status}/${codigo}` : String(r.status) });
    }
  } catch (e) {
    console.error('convite: falha de rede com o Supabase', e);
    return falha(502);
  }
  return querJson ? json({ success: true }) : redirecionar('/obrigado');
}
