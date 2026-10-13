# Copy v2 e indicação pós-inscrição — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** aplicar a copy v2 da página e transformar a tela de sucesso do formulário em convite para indicar um colega, rastreado por código aleatório.

**Architecture:** a copy muda só em componentes Astro e em `src/data/conteudo.ts`. A indicação ganha um módulo puro (`src/lib/indicacao.ts`) usado pelo script do formulário (gera e guarda o código, monta links) e pelo Worker (valida o código, grava a coluna nova, marca a indicação no aviso do Telegram). O banco ganha uma coluna, um índice único parcial e uma view.

**Tech Stack:** Astro 7, Tailwind 4, Alpine 3, Cloudflare Workers, Supabase (PostgREST), Vitest 5, Playwright 1.63.

**Spec:** [docs/superpowers/specs/2026-10-13-copy-v2-e-indicacao-design.md](../specs/2026-10-13-copy-v2-e-indicacao-design.md) · notas [NT-003](../../notas-tecnicas/NT-003-copy-v2.md) e [NT-004](../../notas-tecnicas/NT-004-pos-inscricao-indicacao.md)

## Global Constraints

- Nenhum travessão (— ou –) em texto visível; o teste `qualidade.spec.ts` "nenhum travessão em texto visível" continua verde.
- "convite" nomeia a ação; "teste" só a fase do produto (spec D2).
- O h1 cabe em no máximo 3 linhas no desktop de 1440 px (teste `hero.spec.ts`).
- Cores, raios e tipos só dos tokens do `DESIGN.md`; nenhuma cor nova.
- Prazo prometido: "em até 3 dias úteis" (spec D3).
- Código de indicação: 8 caracteres, regex `^[a-hjkmnp-z2-9]{8}$`, gerado com `crypto.getRandomValues`.
- O link de indicação usa `location.origin`, nunca `PUBLIC_SITE_URL` (spec §4.2).
- `WHATSAPP_EMPRESA` vazia → nenhum bloco "Salve nosso número" (spec D7).
- Git no disco E: prefixar comandos com `export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=E:/ArrayOF/jp/landing_page`.
- Antes de `npx playwright test`, liberar a porta 4321 (o `webServer` reaproveita servidor antigo).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **h1 mais longo em larguras intermediárias** (1024 a 1280 px) e no celular de 360 px: sem estouro horizontal e sem quebra feia (`text-wrap: balance`).
2. **Área de transferência indisponível** (iOS sem permissão, contexto sem HTTPS): "Copiar link" mostra o link em texto selecionável, nunca falha calado.
3. **`localStorage` bloqueado** (Safari privado, cookies bloqueados): a tela de sucesso continua funcionando com um código novo.
4. **Codificação da mensagem do WhatsApp:** acentos, vírgulas e o `?ref=` chegam íntegros em `wa.me/?text=`.
5. **Ordem de publicação:** o Worker novo não pode ir ao ar antes de `supabase/003_indicacao.sql` (todo pedido falharia com PGRST204).

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/components/{Hero,Nav,BarraCelular,ComoFunciona,Previa,ParaQuem,Sobre}.astro` | Modificar | Copy v2 |
| `src/pages/index.astro`, `src/layouts/Base.astro`, `src/pages/obrigado.astro` | Modificar | Title, meta, og, prazo |
| `src/data/conteudo.ts` | Modificar | Passo "Agende", FAQ, `WHATSAPP_EMPRESA` |
| `src/lib/indicacao.ts` | Criar | Código, validação, links e mensagem |
| `src/worker/convite.ts` | Modificar | Grava `codigo_indicacao`; aviso com indicação |
| `src/scripts/formulario.ts` | Modificar | Código no envio; copiar e compartilhar |
| `src/components/Participe.astro` | Modificar | Copy v2 e tela de sucesso nova |
| `src/pages/privacidade.astro` | Modificar | Código de indicação e `localStorage` |
| `supabase/003_indicacao.sql` | Criar | Coluna, índice e view |
| `tests/e2e/copy-v2.spec.ts` | Criar | Textos da copy v2 |
| `tests/unit/indicacao.test.ts` | Criar | Módulo de indicação |
| `tests/e2e/indicacao.spec.ts` | Criar | Tela de sucesso |

---

### Tarefa 1: Copy v2

**Files:**
- Modify: os componentes, páginas e `src/data/conteudo.ts` da tabela acima
- Create: `tests/e2e/copy-v2.spec.ts`
- Modify: `tests/e2e/hero.spec.ts:5-6`, `tests/e2e/navegacao.spec.ts:49-55`, `tests/e2e/formulario.spec.ts:69`, `tests/e2e/duvidas.spec.ts:8`, `tests/e2e/seo.spec.ts:5`

**Interfaces:** Produces: rótulo "Quero meu convite" nos cinco botões; `PERGUNTAS` com 8 itens.

- [ ] **Step 1: Escrever os testes**

`tests/e2e/copy-v2.spec.ts`:

```ts
import { expect, test } from './fixtures';

test('hero da copy v2', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só.');
  await expect(page.locator('#topo')).toContainText('Em teste com adestradores');
  await expect(page.locator('#topo')).toContainText('Tudo organizado no Telegram, no celular e no computador. Sem caderno, sem planilha, sem instalar outro app.');
  await expect(page.locator('#topo')).not.toContainText('Em construção');
});

test('botões de chamada pedem o convite, nenhum fala em testar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Quero testar' })).toHaveCount(0);
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero meu convite' })).toHaveAttribute('href', '#participe');
  await expect(page.locator('#como-funciona').getByRole('link', { name: 'Quero meu convite' })).toBeVisible();
});

test('textos novos e removidos da copy v2', async ({ page }) => {
  await page.goto('/');
  const corpo = page.locator('body');
  for (const novo of [
    'Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar.',
    'Agenda por dia ou semana, sessões que se repetem sozinhas e aviso quando dois horários se cruzam.',
    'Abre numa conversa do Telegram, como um contato. Não tem outro aplicativo para baixar.',
    'Seus tutores não mudam nada.',
    'A conversa com eles continua no seu WhatsApp. Só você usa a JornadaPet.',
    'Quem atende os mesmos clientes toda semana.',
    'Preço e quais profissionais mais precisam disso.',
    'Respondemos em até 3 dias úteis.',
    'Não vendemos nem usamos os dados dos seus clientes para outro fim.',
    'Funciona no iPhone e no Android?',
  ]) await expect(corpo).toContainText(novo);
  for (const velho of ['nosso bot', 'carteira recorrente', 'repetição toda semana', 'canal certo', 'não são compartilhados', 'nos próximos dias']) {
    await expect(corpo).not.toContainText(velho);
  }
});

test('/obrigado promete o prazo', async ({ page }) => {
  await page.goto('/obrigado');
  await expect(page.locator('main')).toContainText('em até 3 dias úteis');
});

test('title, description e og alinhados à promessa', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('JornadaPet: agenda, clientes e pagamentos para adestradores');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Organize clientes, agenda e quem ainda falta pagar do seu trabalho de adestramento, direto no Telegram, sem instalar outro app. Acesso por convite.');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'JornadaPet: clientes, agenda e pagamentos do adestrador, num lugar só');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', 'Clientes, agenda e quem ainda falta pagar, organizados no Telegram. Acesso por convite.');
});
```

Ajustes nos testes existentes:
- `hero.spec.ts:5` → o h1 novo; `:6` → `{ name: 'Quero meu convite' }`.
- `navegacao.spec.ts:49-55` → trocar "Quero testar" por "Quero meu convite" (nome do teste e dois localizadores).
- `formulario.spec.ts:69` → `{ hasText: 'Quero meu convite' }`.
- `duvidas.spec.ts:8` → `toHaveCount(8)`.
- `seo.spec.ts:5` → o title novo.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/copy-v2.spec.ts tests/e2e/hero.spec.ts --project=desktop`
Expected: FAIL nos cinco testes de `copy-v2` e no primeiro de `hero` (textos antigos).

- [ ] **Step 3: Aplicar os textos**

Trocar exatamente, conforme a spec §3:
- `Hero.astro:11` → ícone `ph:flask`, texto "Em teste com adestradores"; `:13` → h1 novo; `:14` → apoio novo; `:16` → "Quero meu convite".
- `Nav.astro:16` e `:29`, `BarraCelular.astro:6`, `ComoFunciona.astro:91` → "Quero meu convite".
- `ComoFunciona.astro:12` → "Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar."
- `conteudo.ts:19` (passo `agende`) → "Agenda por dia ou semana, sessões que se repetem sozinhas e aviso quando dois horários se cruzam."
- `Previa.astro:5` → texto novo de "Dentro do Telegram"; acrescentar em `esquerda`, como 3º item:
  `{ icone: 'ph:whatsapp-logo', titulo: 'Seus tutores não mudam nada', texto: 'A conversa com eles continua no seu WhatsApp. Só você usa a JornadaPet.' }`
- `ParaQuem.astro:18` → "Quem atende os mesmos clientes toda semana. É com vocês que estamos construindo agora."
- `Sobre.astro:9` → "Preço e quais profissionais mais precisam disso."
- `Participe.astro:37` → "nos próximos dias" vira "em até 3 dias úteis"; `:99` → "Respondemos em até 3 dias úteis."
- `obrigado.astro:11` → "A gente chama você no WhatsApp em até 3 dias úteis para conversar e enviar o seu convite."
- `conteudo.ts` FAQ "E os dados dos meus clientes?" → texto da spec; inserir depois de "Preciso usar o Telegram?":
  `{ pergunta: 'Funciona no iPhone e no Android?', resposta: 'Sim. A JornadaPet funciona dentro do Telegram, que tem aplicativo para iPhone, Android e computador.' }`
- `index.astro:19` → title e description novos; `Base.astro:31-32` → og:title e og:description novos.

- [ ] **Step 4: Rodar e ver passar; conferir o h1**

Run: `npx playwright test tests/e2e/copy-v2.spec.ts tests/e2e/hero.spec.ts tests/e2e/navegacao.spec.ts tests/e2e/duvidas.spec.ts tests/e2e/seo.spec.ts tests/e2e/formulario.spec.ts`
Expected: PASS. Se "título em no máximo 3 linhas no desktop" falhar, trocar em `Hero.astro:13` `text-[clamp(2.3rem,4.4vw,3.6rem)]` por `text-[clamp(2.1rem,3.8vw,3.1rem)]` e acrescentar `text-balance`; rodar de novo.

Conferir em captura: 1440, 1280, 1024 e 360 px, sem rolagem horizontal (`qualidade.spec.ts` "sem rolagem horizontal").

- [ ] **Step 5: Suíte e commit**

Run: `npm test && npx playwright test`
Expected: tudo verde (6 testes pulados por regra de projeto).

```bash
git add src tests
git commit -m "feat: copy v2 (convite, título, prazo, objeções e SEO)"
```

---

### Tarefa 2: Módulo de indicação

**Files:**
- Create: `src/lib/indicacao.ts`
- Create: `tests/unit/indicacao.test.ts`

**Interfaces:**
- Produces:
  - `REGEX_CODIGO: RegExp`
  - `gerarCodigo(aleatorio?: (b: Uint8Array) => Uint8Array): string`
  - `codigoValido(c: unknown): c is string`
  - `codigoDaIndicacao(storage: Pick<Storage, 'getItem' | 'setItem'> | null, gerar?: () => string): string`
  - `linkDeIndicacao(origem: string, codigo: string): string`
  - `mensagemDeIndicacao(link: string): string`
  - `linkCompartilharWhatsapp(mensagem: string): string`
  - `linkWhatsappEmpresa(numero: string): string | null`

- [ ] **Step 1: Escrever os testes**

```ts
import { describe, expect, it } from 'vitest';
import {
  REGEX_CODIGO, codigoDaIndicacao, codigoValido, gerarCodigo, linkCompartilharWhatsapp,
  linkDeIndicacao, linkWhatsappEmpresa, mensagemDeIndicacao,
} from '../../src/lib/indicacao';

describe('gerarCodigo', () => {
  it('gera 8 caracteres do alfabeto sem ambíguos', () => {
    for (let i = 0; i < 200; i++) expect(gerarCodigo()).toMatch(REGEX_CODIGO);
  });
  it('descarta bytes que enviesariam o alfabeto', () => {
    let chamada = 0;
    const falso = (b: Uint8Array) => { b.fill(chamada++ === 0 ? 255 : 0); return b; };
    expect(gerarCodigo(falso)).toBe('aaaaaaaa');
  });
});

describe('codigoValido', () => {
  it.each(['k7m2pq9x', 'abcdefgh', '23456789'])('aceita %s', (c) => expect(codigoValido(c)).toBe(true));
  it.each(['K7M2PQ9X', 'k7m2pq9', 'k7m2pq9xx', 'k7m2pq0x', 'k7m2pqox', 'k7m2pqlx', 'k7m2pqix', '', null, 12345678])('recusa %s', (c) => expect(codigoValido(c)).toBe(false));
});

describe('codigoDaIndicacao', () => {
  const memoria = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
  it('gera, guarda e reusa o mesmo código', () => {
    const s = memoria();
    const primeiro = codigoDaIndicacao(s, () => 'k7m2pq9x');
    expect(primeiro).toBe('k7m2pq9x');
    expect(codigoDaIndicacao(s, () => 'outro999')).toBe('k7m2pq9x');
  });
  it('troca um código guardado inválido', () => {
    const s = memoria(); s.setItem('jp-codigo', 'invalido!');
    expect(codigoDaIndicacao(s, () => 'abcdefgh')).toBe('abcdefgh');
  });
  it('sem storage ou com storage que lança, ainda devolve um código', () => {
    expect(codigoDaIndicacao(null, () => 'abcdefgh')).toBe('abcdefgh');
    const quebrado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(codigoDaIndicacao(quebrado, () => 'abcdefgh')).toBe('abcdefgh');
  });
});

describe('links e mensagem', () => {
  it('link de indicação usa a origem da página', () => {
    expect(linkDeIndicacao('https://jornadapet.arrayof.workers.dev', 'k7m2pq9x')).toBe('https://jornadapet.arrayof.workers.dev/?ref=k7m2pq9x');
  });
  it('mensagem cita o produto e termina no link, sem travessão', () => {
    const m = mensagemDeIndicacao('https://x.dev/?ref=k7m2pq9x');
    expect(m).toBe('Pedi meu convite para testar a JornadaPet, que organiza clientes, agenda e quem ainda falta pagar, direto no Telegram. Peça o seu: https://x.dev/?ref=k7m2pq9x');
    expect(m).not.toMatch(/[—–]/);
  });
  it('compartilhar no WhatsApp codifica acentos e o ?ref=', () => {
    const url = linkCompartilharWhatsapp('Peça o seu: https://x.dev/?ref=k7m2pq9x');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe('Peça o seu: https://x.dev/?ref=k7m2pq9x');
  });
  it('WhatsApp da empresa: link só com número válido', () => {
    expect(linkWhatsappEmpresa('(11) 98765-4321')).toBe('https://wa.me/5511987654321');
    expect(linkWhatsappEmpresa('')).toBeNull();
    expect(linkWhatsappEmpresa('98765-4321')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/indicacao.test.ts`
Expected: FAIL com "Cannot find module '../../src/lib/indicacao'".

- [ ] **Step 3: Implementar**

```ts
import { digitosWhatsapp, whatsappValido } from './whatsapp';

/** a-z e 2-9 sem 0 o 1 l i: 31 símbolos, legíveis se alguém ditar o link (NT-004 §2). */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
export const REGEX_CODIGO = /^[a-hjkmnp-z2-9]{8}$/;
const CHAVE = 'jp-codigo';
const LIMITE = 256 - (256 % ALFABETO.length); // bytes acima disso enviesariam o sorteio

export function gerarCodigo(aleatorio: (b: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  let codigo = '';
  while (codigo.length < 8) {
    for (const byte of aleatorio(new Uint8Array(16))) {
      if (byte < LIMITE && codigo.length < 8) codigo += ALFABETO[byte % ALFABETO.length];
    }
  }
  return codigo;
}

export function codigoValido(c: unknown): c is string {
  return typeof c === 'string' && REGEX_CODIGO.test(c);
}

/** O mesmo navegador reusa o mesmo código; storage bloqueado não quebra nada. */
export function codigoDaIndicacao(storage: Pick<Storage, 'getItem' | 'setItem'> | null, gerar: () => string = gerarCodigo): string {
  try {
    const guardado = storage?.getItem(CHAVE);
    if (codigoValido(guardado)) return guardado;
  } catch { /* storage bloqueado */ }
  const novo = gerar();
  try { storage?.setItem(CHAVE, novo); } catch { /* storage bloqueado */ }
  return novo;
}

export const linkDeIndicacao = (origem: string, codigo: string) => `${origem.replace(/\/+$/, '')}/?ref=${codigo}`;

export const mensagemDeIndicacao = (link: string) =>
  `Pedi meu convite para testar a JornadaPet, que organiza clientes, agenda e quem ainda falta pagar, direto no Telegram. Peça o seu: ${link}`;

export const linkCompartilharWhatsapp = (mensagem: string) => `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

export function linkWhatsappEmpresa(numero: string): string | null {
  return whatsappValido(numero) ? `https://wa.me/55${digitosWhatsapp(numero)}` : null;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/indicacao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/indicacao.ts tests/unit/indicacao.test.ts
git commit -m "feat: módulo de indicação (código, links e mensagem)"
```

---

### Tarefa 3: Worker e banco

**Files:**
- Modify: `src/worker/convite.ts` (montagem da `linha` e `textoDoAviso`)
- Create: `supabase/003_indicacao.sql`
- Modify: `tests/unit/convite.test.ts`

**Interfaces:**
- Consumes: `codigoValido` (Tarefa 2).
- Produces: coluna `convites.codigo_indicacao`; campo `codigo_indicacao` aceito no corpo de `/api/convite`.

- [ ] **Step 1: Escrever os testes** (acrescentar a `tests/unit/convite.test.ts`)

```ts
describe('tratarConvite: indicação', () => {
  it('grava o código de indicação válido', async () => {
    const f = servicos();
    await tratar(json({ ...valido, codigo_indicacao: 'k7m2pq9x' }), f);
    expect(linhaGravada(f).codigo_indicacao).toBe('k7m2pq9x');
  });
  it('ignora código inválido sem recusar o pedido', async () => {
    const f = servicos();
    const r = await tratar(json({ ...valido, codigo_indicacao: "x'; drop table" }), f);
    expect(r.status).toBe(200);
    expect(linhaGravada(f)).not.toHaveProperty('codigo_indicacao');
  });
  it('aviso no Telegram marca quem chegou por indicação', async () => {
    const f = servicos();
    const pendentes: Promise<unknown>[] = [];
    await tratarConvite(json({ ...valido, ref: 'k7m2pq9x' }), { ...env, TELEGRAM_BOT_TOKEN: 'tg-token', TELEGRAM_CHAT_ID: '-100123' }, f as unknown as typeof fetch, (p) => { pendentes.push(p); });
    await Promise.all(pendentes);
    const texto = JSON.parse(chamadas(f, TELEGRAM)[0][1].body as string).text as string;
    expect(texto).toContain('Indicação: código k7m2pq9x');
    expect(texto).not.toContain('ref: k7m2pq9x');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/convite.test.ts`
Expected: FAIL nos três testes novos.

- [ ] **Step 3: Implementar**

Em `convite.ts`, importar `codigoValido` de `../lib/indicacao`. Depois do laço de `CHAVES_DE_ORIGEM`:

```ts
  const codigo = texto(bruto.codigo_indicacao);
  if (codigoValido(codigo)) linha.codigo_indicacao = codigo;
```

Em `textoDoAviso`, trocar o `map` da origem por:

```ts
  const origem = CHAVES_DE_ORIGEM.filter((k) => linha[k]).map((k) =>
    k === 'ref' && codigoValido(linha[k]) ? `Indicação: código ${linha[k]}` : `${k}: ${linha[k]}`);
```

`supabase/003_indicacao.sql`:

```sql
-- Indicação pós-inscrição (NT-004). Rodar no SQL Editor ANTES de publicar o Worker que grava a coluna.
alter table public.convites
  add column codigo_indicacao text check (codigo_indicacao ~ '^[a-hjkmnp-z2-9]{8}$');

create unique index convites_codigo_indicacao on public.convites (codigo_indicacao)
  where codigo_indicacao is not null;

-- Quem indicou quem. Só para o painel: sem acesso pela API pública.
create view public.indicacoes with (security_invoker = true) as
  select quem_indicou.nome      as indicou,
         quem_indicou.whatsapp  as whatsapp_de_quem_indicou,
         chegou.nome            as chegou,
         chegou.whatsapp        as whatsapp_de_quem_chegou,
         chegou.criado_em       as chegou_em
  from public.convites chegou
  join public.convites quem_indicou on chegou.ref = quem_indicou.codigo_indicacao;

revoke all on public.indicacoes from anon, authenticated;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test && npx astro check`
Expected: PASS; 0 erros.

- [ ] **Step 5: Commit**

```bash
git add src/worker/convite.ts tests/unit/convite.test.ts supabase/003_indicacao.sql
git commit -m "feat: Worker grava o código de indicação e marca indicações no aviso"
```

---

### Tarefa 4: Tela de sucesso com indicação

**Files:**
- Modify: `src/scripts/formulario.ts`, `src/components/Participe.astro`, `src/data/conteudo.ts`
- Create: `tests/e2e/indicacao.spec.ts`

**Interfaces:**
- Consumes: `codigoDaIndicacao`, `linkDeIndicacao`, `mensagemDeIndicacao`, `linkCompartilharWhatsapp`, `linkWhatsappEmpresa`, `REGEX_CODIGO` (Tarefa 2).
- Produces: estado Alpine `codigo`, `link`, `compartilhar`, `copiado`, `mostrarLink`; método `copiar()`; campo `codigo_indicacao` no envio.

- [ ] **Step 1: Escrever os testes**

```ts
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const REGEX = /^[a-hjkmnp-z2-9]{8}$/;

async function enviarComSucesso(page: Page, corpos: Record<string, string>[]) {
  await page.route('**/api/convite', async (r) => { corpos.push(r.request().postDataJSON()); await r.fulfill({ json: { success: true } }); });
  await page.goto('/#participe');
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp', { exact: true }).fill('(19) 99876-1234');
  await page.locator('label.chip-opt', { hasText: 'Adestramento' }).click();
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
}

test('sucesso convida a indicar, com o código do envio no link', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await enviarComSucesso(page, corpos);
  const codigo = corpos[0].codigo_indicacao;
  expect(codigo).toMatch(REGEX);
  await expect(page.getByText('Conhece outro adestrador?')).toBeVisible();
  const href = await page.getByRole('link', { name: 'Enviar pelo WhatsApp' }).getAttribute('href');
  expect(href?.startsWith('https://wa.me/?text=')).toBe(true);
  const mensagem = decodeURIComponent(href!.slice('https://wa.me/?text='.length));
  expect(mensagem).toContain(`http://localhost:4321/?ref=${codigo}`);
  expect(mensagem).toContain('Peça o seu:');
});

test('copiar link avisa e coloca o link na área de transferência', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const corpos: Record<string, string>[] = [];
  await enviarComSucesso(page, corpos);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByRole('button', { name: 'Link copiado' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`http://localhost:4321/?ref=${corpos[0].codigo_indicacao}`);
});

test('sem área de transferência, mostra o link para selecionar', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('negado')) } }); });
  const corpos: Record<string, string>[] = [];
  await enviarComSucesso(page, corpos);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByText(`http://localhost:4321/?ref=${corpos[0].codigo_indicacao}`)).toBeVisible();
});

test('o mesmo navegador reusa o código num segundo envio', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await enviarComSucesso(page, corpos);
  await page.getByRole('button', { name: 'Enviar outro contato' }).click();
  await page.reload();
  await enviarComSucesso(page, corpos);
  expect(corpos[1].codigo_indicacao).toBe(corpos[0].codigo_indicacao);
});

test('sem WhatsApp da empresa configurado, não há "Salve nosso número"', async ({ page }) => {
  await enviarComSucesso(page, []);
  await expect(page.getByText('Salve nosso número')).toHaveCount(0);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/indicacao.spec.ts --project=desktop`
Expected: FAIL nos quatro primeiros (sem `codigo_indicacao` e sem o cartão); o quinto passa (trava de regressão para quando a constante for preenchida).

- [ ] **Step 3: Implementar**

`src/data/conteudo.ts`:

```ts
/** WhatsApp da empresa para "Salve nosso número" (NT-004 §4). Vazio: o bloco não aparece. */
export const WHATSAPP_EMPRESA = '';
```

`src/scripts/formulario.ts`:
- importar `codigoDaIndicacao, linkCompartilharWhatsapp, linkDeIndicacao, mensagemDeIndicacao` de `../lib/indicacao`;
- função `local(): Storage | null` igual a `sessao()`, com `window.localStorage`;
- em `Formulario`: `codigo: string; link: string; compartilhar: string; copiado: boolean; mostrarLink: boolean; copiar(): Promise<void>;`
- estado inicial: `codigo: '', link: '', compartilhar: '', copiado: false, mostrarLink: false`;
- no `init()`, depois da origem:

```ts
      this.codigo = codigoDaIndicacao(local());
      this.link = linkDeIndicacao(window.location.origin, this.codigo);
      this.compartilhar = linkCompartilharWhatsapp(mensagemDeIndicacao(this.link));
```

- no envio: `{ ...montarEnvio(this.f, this.origem), 'cf-turnstile-response': token, codigo_indicacao: this.codigo }`;
- método:

```ts
    async copiar() {
      try {
        await navigator.clipboard.writeText(this.link);
        this.copiado = true;
        setTimeout(() => { this.copiado = false; }, 2000);
      } catch {
        this.mostrarLink = true; // sem permissão: o link aparece para selecionar
      }
    },
```

`src/components/Participe.astro`, no bloco de sucesso, entre o parágrafo do prazo e "Enviar outro contato":

```astro
{numeroEmpresa && (
  <p class="mt-3 max-w-[38ch] text-[16px] leading-relaxed">Salve nosso número para reconhecer a mensagem: <a href={numeroEmpresa} target="_blank" rel="noopener" class="font-semibold text-ink underline">{mascararWhatsapp(WHATSAPP_EMPRESA)}</a></p>
)}
<div class="mt-6 w-full r-card bg-mint p-5">
  <p class="font-semibold text-ink">Conhece outro adestrador?</p>
  <p class="mt-1 text-[16px] leading-relaxed">Mande o link para ele pedir o convite também.</p>
  <div class="mt-4 flex flex-wrap gap-2">
    <a :href="compartilhar" target="_blank" rel="noopener" class="cta r-ctl inline-flex items-center gap-2 px-4 py-3 text-[14px] font-semibold"><Icon name="ph:whatsapp-logo" class="size-4" aria-hidden="true" /> Enviar pelo WhatsApp</a>
    <button type="button" x-show="!mostrarLink" @click="copiar()" class="r-ctl inline-flex items-center gap-2 border border-line bg-surface px-4 py-3 text-[14px] font-semibold text-ink hover:border-ink/40">
      <Icon name="ph:link" class="size-4" aria-hidden="true" /> <span x-text="copiado ? 'Link copiado' : 'Copiar link'">Copiar link</span>
    </button>
    <p x-cloak x-show="mostrarLink" class="select-all break-all r-ctl bg-surface px-3 py-2 text-[14px] text-ink" x-text="link"></p>
  </div>
  <p class="sr-only" aria-live="polite" x-text="copiado ? 'Link copiado' : ''"></p>
</div>
```

No frontmatter: `import { CONTATO_EMAIL, WHATSAPP_EMPRESA } from '../data/conteudo';`, `import { linkWhatsappEmpresa } from '../lib/indicacao';`, `import { mascararWhatsapp } from '../lib/whatsapp';` e `const numeroEmpresa = linkWhatsappEmpresa(WHATSAPP_EMPRESA);`. Trocar `min-h-[420px]` do bloco de sucesso por `min-h-[480px]` se o cartão novo deslocar o layout.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx playwright test tests/e2e/indicacao.spec.ts tests/e2e/formulario.spec.ts tests/e2e/qualidade.spec.ts`
Expected: PASS, inclusive o axe nos dois temas (o cartão `bg-mint` precisa de contraste com `text-ink`).

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat: tela de sucesso convida a indicar um colega (link com código)"
```

---

### Tarefa 5: Política de privacidade, documentação e verificação final

**Files:**
- Modify: `src/pages/privacidade.astro`, `tests/e2e/seo.spec.ts`, `docs/README.md`

- [ ] **Step 1: Escrever o teste** (acrescentar a `tests/e2e/seo.spec.ts`)

```ts
test('política cita o código de indicação e o armazenamento local', async ({ page }) => {
  await page.goto('/privacidade');
  const main = page.locator('main');
  await expect(main).toContainText('código aleatório de indicação');
  await expect(main).toContainText('armazenamento local do navegador');
  await expect(main).toContainText('Atualizada em 13 de outubro de 2026.');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/seo.spec.ts --project=desktop`
Expected: FAIL no teste novo.

- [ ] **Step 3: Implementar**

Em `privacidade.astro`:
- `ATUALIZADA_EM = '13 de outubro de 2026'`;
- "O que coletamos", novo item depois da origem da visita: "Um código aleatório de indicação, que vai no link que você pode mandar a um colega. Ele não contém nenhum dado seu e serve só para sabermos quem indicou quem.";
- "O que fica no seu navegador", trocar por: "Esta página não usa cookies próprios nem ferramentas de análise ou de publicidade. Se você chegar por um link com origem (utm ou ref), guardamos essa origem no armazenamento da aba, que é apagado quando a aba é fechada. O seu código aleatório de indicação fica no armazenamento local do navegador, para o link continuar o mesmo se você voltar. A verificação contra robôs da Cloudflare pode ler informações técnicas do navegador no momento do envio."

Em `docs/README.md`, nova seção "Copy v2 e indicação — 2026-10-13" com links para NT-003, NT-004, spec e plano, e a linha na tabela de frentes.

- [ ] **Step 4: Verificação final**

Run: `npm test && npx playwright test`
Expected: tudo verde (6 pulados). Conferir em captura a tela de sucesso nos dois temas, no desktop e no celular.

- [ ] **Step 5: Commit (sem push)**

```bash
git add src tests docs
git commit -m "docs: política cita a indicação; README com NT-003 e NT-004"
```

## Checklist de publicação (bloqueia o push)

1. Rodar `supabase/003_indicacao.sql` no SQL Editor do Supabase. Conferir em Table Editor a coluna `codigo_indicacao` e a view `indicacoes`.
2. Só então `git push`. Esperar o deploy.
3. Pedido real pela página; abrir o link "Enviar pelo WhatsApp", mandar a si mesmo, abrir o link `?ref=` em outro navegador e fazer um segundo pedido com outro WhatsApp. A view `indicacoes` mostra a ligação, e o aviso no Telegram traz "Indicação: código …".
