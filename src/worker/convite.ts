import { TEXTO_DO_ACEITE } from '../lib/formulario';
import { CHAVES_DE_ORIGEM } from '../lib/utm';
import { validar, type Dados } from '../lib/validacao';
import { digitosWhatsapp, mascararWhatsapp } from '../lib/whatsapp';
import { codigoValido } from '../lib/indicacao';

/** Binding de limite de envios do Cloudflare (ratelimits no wrangler.jsonc). */
export interface Limitador { limit(opcoes: { key: string }): Promise<{ success: boolean }> }

/** Configuração do Worker (vars no wrangler.jsonc; segredos em Settings → Variables and Secrets). */
export interface Ambiente {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  LIMITE_CONVITE?: Limitador;
  /** Aviso de cada pedido num grupo do Telegram (opcional: sem os dois, só grava). */
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

/** Deixa uma tarefa rodando depois da resposta (ctx.waitUntil no Worker). */
export type Aguardar = (tarefa: Promise<unknown>) => void;

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

/** Chave nova (sb_secret_) vai só no apikey; a service_role antiga é um JWT e vai também no Authorization. */
function cabecalhosSupabase(chave: string): Record<string, string> {
  const c: Record<string, string> = { apikey: chave };
  if (!chave.startsWith('sb_')) c.Authorization = `Bearer ${chave}`;
  return c;
}

/** Nome e cidade de quem tem o código de indicação, para o aviso (NT-004 §2). Falha vira undefined. */
async function quemIndicou(codigo: string, env: Ambiente, fetchFn: typeof fetch): Promise<string | undefined> {
  try {
    const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/convites?select=nome,cidade&codigo_indicacao=eq.${codigo}&limit=1`;
    const r = await fetchFn(url, { headers: cabecalhosSupabase(env.SUPABASE_SECRET_KEY) });
    if (!r.ok) return undefined;
    const [achado] = (await r.json()) as { nome: string; cidade: string }[];
    return achado ? `Indicação de ${achado.nome} (${achado.cidade})` : undefined;
  } catch {
    return undefined;
  }
}

function textoDoAviso(linha: Record<string, string>, indicador?: string, reenvio = false): string {
  const origem = CHAVES_DE_ORIGEM.filter((k) => linha[k]).map((k) =>
    k === 'ref' && codigoValido(linha[k]) ? (indicador ?? `Indicação: código ${linha[k]}`) : `${k}: ${linha[k]}`);
  return [
    reenvio ? 'Reenvio do mesmo WhatsApp hoje (dados novos, não gravados: corrija na fila)' : 'Novo pedido de convite',
    '',
    `Nome: ${linha.nome}`,
    `WhatsApp: ${mascararWhatsapp(linha.whatsapp)}`,
    `Conversar: https://wa.me/55${linha.whatsapp}`,
    `Perfil: ${linha.perfil}`,
    `Cidade: ${linha.cidade}`,
    ...(origem.length ? ['', 'Origem', ...origem] : []),
  ].join('\n');
}

async function avisarNoTelegram(linha: Record<string, string>, token: string, chat: string, env: Ambiente, fetchFn: typeof fetch, reenvio = false): Promise<void> {
  try {
    const indicador = codigoValido(linha.ref) ? await quemIndicou(linha.ref, env, fetchFn) : undefined;
    const texto = textoDoAviso(linha, indicador, reenvio);
    const mandar = (para: string) => fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: para, text: texto, disable_web_page_preview: true }),
    });
    let r = await mandar(chat);
    if (!r.ok) {
      const detalhe = await r.text().catch(() => '');
      // Grupo virou supergrupo (muda o ID): o Telegram informa o novo; manda para ele e avisa no log
      // para atualizar o TELEGRAM_CHAT_ID no painel.
      let novo: unknown;
      try { novo = (JSON.parse(detalhe) as { parameters?: { migrate_to_chat_id?: unknown } }).parameters?.migrate_to_chat_id; } catch { /* corpo sem JSON */ }
      if (typeof novo === 'number' || typeof novo === 'string') {
        console.error(`convite: grupo do Telegram migrou para ${novo}; atualize TELEGRAM_CHAT_ID`);
        r = await mandar(String(novo));
        if (!r.ok) console.error('convite: Telegram respondeu', r.status, await r.text().catch(() => ''));
      } else {
        console.error('convite: Telegram respondeu', r.status, detalhe);
      }
    }
  } catch (e) {
    console.error('convite: falha de rede com o Telegram', e);
  }
}

/** POST /api/convite: valida de novo no servidor e grava em public.convites no Supabase. */
export async function tratarConvite(req: Request, env: Ambiente, fetchFn: typeof fetch = fetch, aguardar: Aguardar = () => {}): Promise<Response> {
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
  const codigo = texto(bruto.codigo_indicacao);
  if (codigoValido(codigo)) linha.codigo_indicacao = codigo;

  const cabecalhos = { ...cabecalhosSupabase(env.SUPABASE_SECRET_KEY), 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  const inserir = () => fetchFn(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/convites`, { method: 'POST', headers: cabecalhos, body: JSON.stringify(linha) });
  let reenvio = false;

  try {
    let r = await inserir();
    let detalhe = r.ok ? '' : await r.text().catch(() => '');
    // Banco ainda sem a coluna (SQL 003 não aplicado antes do deploy): grava sem o código em vez de perder o pedido.
    if (r.status === 400 && detalhe.includes('PGRST204') && detalhe.includes('codigo_indicacao')) {
      console.error('convite: coluna codigo_indicacao ausente; gravando sem ela (rode supabase/003)');
      delete linha.codigo_indicacao;
      r = await inserir();
      detalhe = r.ok ? '' : await r.text().catch(() => '');
    }
    // Mesmo WhatsApp no mesmo dia: o índice recusa e, para quem envia, deu certo; o aviso leva os dados
    // novos, para os sócios verem a correção ("Errou algum dado?"). Outro conflito é erro (NT-004 §2).
    if (r.status === 409 && detalhe.includes('convites_whatsapp_por_dia')) reenvio = true;
    else if (!r.ok) {
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
  // O aviso roda depois da resposta: quem envia não espera o Telegram, e uma falha dele não desfaz o pedido.
  // trim: espaço ou quebra de linha colados no painel fazem o Telegram recusar.
  const tokenTelegram = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatTelegram = env.TELEGRAM_CHAT_ID?.trim();
  if (tokenTelegram && chatTelegram) aguardar(avisarNoTelegram(linha, tokenTelegram, chatTelegram, env, fetchFn, reenvio));
  return querJson ? json({ success: true }) : redirecionar('/obrigado');
}
