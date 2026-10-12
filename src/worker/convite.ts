import { TEXTO_DO_ACEITE } from '../lib/formulario';
import { CHAVES_DE_ORIGEM } from '../lib/utm';
import { validar, type Dados } from '../lib/validacao';
import { digitosWhatsapp } from '../lib/whatsapp';

/** Configuração do Worker (Settings → Variables and Secrets no Cloudflare). */
export interface Ambiente { SUPABASE_URL: string; SUPABASE_SECRET_KEY: string }

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

/** POST /api/convite: valida de novo no servidor e grava em public.convites no Supabase. */
export async function tratarConvite(req: Request, env: Ambiente, fetchFn: typeof fetch = fetch): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  // Envio por fetch (JS) pede JSON; o formulário comum (sem JS) espera redirecionamento.
  const querJson = (req.headers.get('Accept') ?? '').includes('application/json') || (req.headers.get('Content-Type') ?? '').includes('application/json');
  const falha = (status: number, extra: object = {}) => (querJson ? json({ success: false, ...extra }, status) : redirecionar('/nao-enviado'));

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

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return falha(500);

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
    if (!r.ok) {
      console.error('convite: Supabase respondeu', r.status, await r.text().catch(() => ''));
      return falha(502);
    }
  } catch (e) {
    console.error('convite: falha de rede com o Supabase', e);
    return falha(502);
  }
  return querJson ? json({ success: true }) : redirecionar('/obrigado');
}
