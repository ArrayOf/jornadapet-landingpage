# Copy v2, indicação e fila — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** aplicar a copy v2 revisada, tirar o domínio de terceiro dos metadados, transformar a tela de sucesso em convite para indicar um colega (código por WhatsApp, com UTMs) e dar estado e métricas à fila de pedidos.

**Architecture:** a copy muda em componentes Astro e em `src/data/conteudo.ts`. A indicação ganha um módulo puro (`src/lib/indicacao.ts`) usado pelo script do formulário (código por WhatsApp, links, cópia) e pelo Worker (valida o código, trata o 409 pelo nome do índice, busca o nome de quem indicou para o aviso). O banco ganha colunas, um índice comum e três views. O Web Analytics entra por uma constante pública.

**Tech Stack:** Astro 7, Tailwind 4, Alpine 3, Cloudflare Workers, Supabase (PostgREST), Vitest 5, Playwright 1.63.

**Spec:** [docs/superpowers/specs/2026-10-13-copy-v2-e-indicacao-design.md](../specs/2026-10-13-copy-v2-e-indicacao-design.md) · notas [NT-003](../../notas-tecnicas/NT-003-copy-v2.md) e [NT-004](../../notas-tecnicas/NT-004-pos-inscricao-indicacao.md)

## Global Constraints

- Nenhum travessão (— ou –) em texto visível (`qualidade.spec.ts`).
- "convite" nomeia a ação; "teste" só a fase do produto (spec D2).
- h1 em até 3 linhas no desktop (1024, 1280, 1440 px); botão do hero visível em 360×640.
- Cores, raios e tipos só dos tokens do `DESIGN.md`; o cartão de indicação é neutro (`bg-surface`), não sálvia.
- Prazo: "em até 3 dias úteis", só para o primeiro contato.
- Código: 8 caracteres, regex `^[a-hjkmnp-z2-9]{8}$`, `crypto.getRandomValues`, **um por WhatsApp**.
- Link de indicação com `location.origin`, `ref` e UTMs (`utm_source=indicacao`, `utm_medium=whatsapp|link`).
- O 409 só é sucesso quando a resposta cita `convites_whatsapp_por_dia`.
- `WHATSAPP_EMPRESA` e `CLOUDFLARE_ANALYTICS_TOKEN` vazios → nada renderizado.
- Git no disco E: prefixar com `export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=E:/ArrayOF/jp/landing_page`.
- Liberar a porta 4321 antes de `npx playwright test`.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. **Sem push** até o checklist de publicação.

## Review Focus

1. **Dois pedidos no mesmo aparelho** com WhatsApps diferentes: os dois gravam, com códigos diferentes (era o defeito da primeira versão).
2. **Cópia nos navegadores internos** do Instagram e do WhatsApp (sem `navigator.clipboard`): o campo do link aparece com foco e seleção, nada falha calado.
3. **h1 de 78 caracteres** em 1024, 1280 e 360 px: sem estouro, até 3 linhas no desktop, CTA acima da dobra no celular.
4. **Preview do link no WhatsApp**: título, descrição e imagem vêm do `workers.dev`, não do domínio de terceiro.
5. **Ordem de publicação**: o Worker novo não vai ao ar antes do SQL 003.

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/components/{Hero,Nav,BarraCelular,ComoFunciona,Previa,ParaQuem,Sobre,Participe}.astro` | Modificar | Copy v2; tela de sucesso (Participe) |
| `src/pages/{index,obrigado,privacidade}.astro`, `src/layouts/Base.astro` | Modificar | Meta, og por página, prazo, política, analytics |
| `astro.config.mjs`, `src/lib/jsonld.ts` | Modificar | Padrão `workers.dev`; JSON-LD sem e-mail |
| `src/data/conteudo.ts` | Modificar | Passo "Agende", FAQ, `WHATSAPP_EMPRESA`, `CLOUDFLARE_ANALYTICS_TOKEN` |
| `src/lib/indicacao.ts` | Criar | Código por WhatsApp, links, mensagem |
| `src/worker/convite.ts` | Modificar | Código, 409 pelo índice, nome de quem indicou |
| `src/scripts/formulario.ts`, `src/scripts/pagina.ts` | Modificar | Indicação, cópia, "Enviar de novo"; barra fixa some após o pedido |
| `supabase/003_indicacao_e_fila.sql` | Criar | Coluna, índice, fila, grant, views |
| `tests/e2e/copy-v2.spec.ts`, `tests/e2e/indicacao.spec.ts`, `tests/unit/indicacao.test.ts` | Criar | Testes novos |

---

### Tarefa 1: Copy v2 e metadados sem domínio de terceiro

**Files:**
- Modify: os componentes da tabela (menos a tela de sucesso), `index.astro`, `obrigado.astro`, `Base.astro`, `astro.config.mjs`, `jsonld.ts`, `conteudo.ts`
- Create: `tests/e2e/copy-v2.spec.ts`
- Modify: `tests/e2e/hero.spec.ts`, `navegacao.spec.ts`, `formulario.spec.ts`, `duvidas.spec.ts`, `seo.spec.ts`, `tests/unit/jsonld.test.ts`

**Interfaces:** Produces: rótulo "Quero meu convite" nos cinco botões; `PERGUNTAS` com 8 itens; `Base.astro` com props opcionais `ogTitle` e `ogDescription`.

- [ ] **Step 1: Escrever os testes**

`tests/e2e/copy-v2.spec.ts`:

```ts
import { expect, test } from './fixtures';

const H1 = 'Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só.';

test('hero da copy v2', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1);
  const topo = page.locator('#topo');
  await expect(topo).toContainText('Em teste com adestradores');
  await expect(topo).toContainText('Tudo organizado no Telegram, no celular e no computador. Sem caderno, sem planilha, sem instalar outro app.');
  await expect(topo).not.toContainText(/\bbot\b/);
  await expect(page.getByRole('img', { name: 'Exemplo: conversa com a JornadaPet no Telegram, com o botão Abrir JornadaPet' })).toBeVisible();
});

test('botões pedem o convite; nenhum fala em testar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Quero testar' })).toHaveCount(0);
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero meu convite' })).toHaveAttribute('href', '#participe');
  await expect(page.locator('#como-funciona').getByRole('link', { name: 'Quero meu convite' })).toBeVisible();
  await expect(page.locator('#participe h2')).toHaveText('Peça seu convite.');
});

test('textos novos e removidos', async ({ page }) => {
  await page.goto('/');
  const corpo = page.locator('body');
  for (const novo of [
    'Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar.',
    'Veja o dia ou a semana, marque uma vez o horário fixo de cada cão e saiba quando dois horários se cruzam.',
    'Abra o Telegram e veja o dia inteiro: quem você atende, a que horas e quanto falta receber.',
    'Para o tutor, nada muda.',
    'Fica na sua lista de conversas, como um contato. Não tem outro aplicativo para baixar.',
    'Feito primeiro para adestradores de cães.',
    'Estamos começando por quem trabalha sozinho e atende os mesmos cães toda semana.',
    'Aula em casa ou no parque, com horário fixo.',
    'Clientes, agenda e quem ainda falta pagar, dentro do Telegram.',
    'Preço e quais profissionais mais precisam disso.',
    'quando abrir a sua turma, envia o seu convite.',
    'A gente chama você no WhatsApp em até 3 dias úteis.',
    'nunca são vendidos',
    'Preciso baixar algum aplicativo? Funciona no iPhone e no Android?',
  ]) await expect(corpo).toContainText(novo);
  for (const velho of ['No celular e no computador', 'carteira recorrente', 'carteira de clientes recorrentes', 'canal certo', 'não são compartilhados', 'nos próximos dias', 'Em construção', 'Teste antes de todo mundo']) {
    await expect(corpo).not.toContainText(velho);
  }
});

test('/obrigado promete só o primeiro contato e cita as turmas', async ({ page }) => {
  await page.goto('/obrigado');
  await expect(page.locator('main')).toContainText('A gente chama você no WhatsApp em até 3 dias úteis para conversar. Os convites saem aos poucos, em turmas.');
});

test('title, description e og alinhados; og das outras páginas é da própria página', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Agenda, clientes e pagamentos para adestrador de cães | JornadaPet');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Organize clientes, agenda e quem ainda falta pagar no adestramento de cães, direto no Telegram, sem instalar outro app. Acesso por convite.');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'JornadaPet: clientes, agenda e pagamentos do adestrador');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', 'Clientes, agenda e quem ainda falta pagar, organizados no Telegram. Acesso por convite.');
  await page.goto('/privacidade');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Política de privacidade: JornadaPet');
});

test('h1 em até 3 linhas em 1024 e 1280; CTA do hero visível em 360x640', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mede larguras fixas');
  for (const largura of [1024, 1280]) {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto('/');
    const linhas = await page.locator('#topo h1').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
    expect(linhas, `${largura}px`).toBeLessThanOrEqual(3);
  }
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero meu convite' })).toBeInViewport();
});
```

Ajustes nos testes existentes:
- `hero.spec.ts:5` → `H1`; `:6` → `{ name: 'Quero meu convite' }`; `:8` → `{ name: /conversa com a JornadaPet no Telegram/ }`.
- `navegacao.spec.ts:49-55` → "Quero meu convite" (nome do teste e os dois localizadores).
- `formulario.spec.ts:69` → `{ hasText: 'Quero meu convite' }`.
- `duvidas.spec.ts:8` → `toHaveCount(8)`.
- `seo.spec.ts:5` → o title novo; e um teste novo:

```ts
test('metadados no workers.dev, JSON-LD sem e-mail e FAQPage com 8 perguntas', async ({ page }) => {
  await page.goto('/');
  const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent ?? '{}')));
  const org = ld.find((o) => o['@type'] === 'Organization');
  expect(org).not.toHaveProperty('email');
  expect(ld.find((o) => o['@type'] === 'FAQPage').mainEntity).toHaveLength(8);
});
```

- `tests/unit/jsonld.test.ts:20` → `expect(o).not.toHaveProperty('email');`.

O `playwright.config.ts` já define `PUBLIC_SITE_URL=http://localhost:4321`; o padrão `workers.dev` do `astro.config.mjs` é conferido no build publicado (checklist).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/copy-v2.spec.ts --project=desktop && npx vitest run tests/unit/jsonld.test.ts`
Expected: FAIL nos testes de copy (textos antigos) e no de JSON-LD (`email` presente).

- [ ] **Step 3: Implementar**

Textos (spec §3):
- `Hero.astro:11` → `ph:seal-check`, "Em teste com adestradores"; `:13` → h1; `:14` → apoio; `:16` → "Quero meu convite"; `:28` alt → "Border collie correndo atrás de uma bolinha de tênis durante o adestramento"; `:31` aria-label → "Exemplo: conversa com a JornadaPet no Telegram, com o botão Abrir JornadaPet"; `:34` "bot" → "no Telegram".
- `Nav.astro:16` e `:29`, `BarraCelular.astro:6`, `ComoFunciona.astro:91` → "Quero meu convite".
- `ComoFunciona.astro:12` → "Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar."
- `conteudo.ts:19` (`agende`) → "Veja o dia ou a semana, marque uma vez o horário fixo de cada cão e saiba quando dois horários se cruzam."
- `Previa.astro:17` → "Abra o Telegram e veja o dia inteiro: quem você atende, a que horas e quanto falta receber."; `esquerda` passa a ser:
  ```ts
  const esquerda = [
    { icone: 'ph:users-three', titulo: 'Para o tutor, nada muda', texto: 'A conversa continua no seu WhatsApp. Só você usa a JornadaPet.' },
    { icone: 'ph:telegram-logo', titulo: 'Dentro do Telegram', texto: 'Fica na sua lista de conversas, como um contato. Não tem outro aplicativo para baixar.' },
  ];
  ```
  (o título do item leva ponto no texto da spec; aqui vai sem, como os outros títulos da Prévia, e o teste busca "Para o tutor, nada muda").
- `ParaQuem.astro:9` → "Feito primeiro para adestradores de cães."; `:10` → intro nova; `:18` → "Aula em casa ou no parque, com horário fixo. É com vocês que estamos construindo agora."
- `Sobre.astro:7` → `{ icone: 'ph:seal-check', titulo: 'Em teste', texto: 'Clientes, agenda e quem ainda falta pagar, dentro do Telegram.', … }`; `:9` → "Preço e quais profissionais mais precisam disso."
- `Participe.astro:24` → "Peça seu convite."; `:25` → "O acesso é por convite. Deixe seu contato: a gente conversa sobre a sua rotina e, quando abrir a sua turma, envia o seu convite."; `:99` → "A gente chama você no WhatsApp em até 3 dias úteis."
- `obrigado.astro:11` → texto da spec.
- `conteudo.ts` FAQ dos dados → texto da spec; depois de "Preciso usar o Telegram?" inserir a pergunta "Preciso baixar algum aplicativo? Funciona no iPhone e no Android?" com a resposta da spec.
- `index.astro:19` → title e description novos.

Metadados:
- `Base.astro`: props `ogTitle?: string; ogDescription?: string`; `og:title` = `ogTitle ?? title`, `og:description` = `ogDescription ?? description`. `index.astro` passa os og da spec.
- `astro.config.mjs:7` → `process.env.PUBLIC_SITE_URL ?? 'https://jornadapet.arrayof.workers.dev'`.
- `jsonld.ts:10` → remover `email: CONTATO_EMAIL` e o import que sobrar.

- [ ] **Step 4: Rodar e ver passar; medir o h1**

Run: `npx playwright test tests/e2e/copy-v2.spec.ts tests/e2e/hero.spec.ts`
Expected: PASS. Se o teste de linhas falhar: em `Hero.astro:13`, `text-[clamp(2.3rem,4.4vw,3.6rem)]` → `text-[clamp(2rem,3.6vw,2.75rem)]` com `text-balance`; se ainda falhar, h1 "Adestrador: seus clientes, sua agenda e quem falta pagar, num lugar só." (atualizar `H1` e a spec).

- [ ] **Step 5: Suíte e commit**

Run: `npm test && npx playwright test`
Expected: tudo verde (6 pulados).

```bash
git add src astro.config.mjs tests
git commit -m "feat: copy v2 e metadados sem domínio de terceiro"
```

---

### Tarefa 2: Módulo de indicação

**Files:** Create `src/lib/indicacao.ts`, `tests/unit/indicacao.test.ts`

**Interfaces — Produces:**
- `REGEX_CODIGO: RegExp`
- `gerarCodigo(aleatorio?: (b: Uint8Array) => Uint8Array): string`
- `codigoValido(c: unknown): c is string`
- `codigoParaWhatsapp(storage: Pick<Storage,'getItem'|'setItem'> | null, whatsapp: string, gerar?: () => string): string`
- `linkDeIndicacao(origem: string, codigo: string, meio: 'whatsapp' | 'link'): string`
- `mensagemDeIndicacao(link: string): string`
- `linkCompartilharWhatsapp(mensagem: string): string`
- `linkWhatsappEmpresa(numero: string): string | null`

- [ ] **Step 1: Escrever os testes**

```ts
import { describe, expect, it } from 'vitest';
import {
  REGEX_CODIGO, codigoParaWhatsapp, codigoValido, gerarCodigo, linkCompartilharWhatsapp,
  linkDeIndicacao, linkWhatsappEmpresa, mensagemDeIndicacao,
} from '../../src/lib/indicacao';

const memoria = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
let n = 0;
const sequencia = () => ['aaaaaaaa', 'bbbbbbbb', 'cccccccc'][n++ % 3];

describe('gerarCodigo', () => {
  it('8 caracteres do alfabeto sem ambíguos', () => { for (let i = 0; i < 200; i++) expect(gerarCodigo()).toMatch(REGEX_CODIGO); });
  it('descarta bytes que enviesariam o sorteio', () => {
    let chamada = 0;
    expect(gerarCodigo((b) => b.fill(chamada++ === 0 ? 255 : 0))).toBe('aaaaaaaa');
  });
});

describe('codigoValido', () => {
  it.each(['k7m2pq9x', 'abcdefgh', '23456789'])('aceita %s', (c) => expect(codigoValido(c)).toBe(true));
  it.each(['K7M2PQ9X', 'k7m2pq9', 'k7m2pq9xx', 'k7m2pq0x', 'k7m2pqox', 'k7m2pqlx', 'k7m2pqix', '', null, 12345678])('recusa %s', (c) => expect(codigoValido(c)).toBe(false));
});

describe('codigoParaWhatsapp', () => {
  it('um código por WhatsApp: o mesmo reusa, outro ganha código novo', () => {
    n = 0; const s = memoria();
    const a = codigoParaWhatsapp(s, '(19) 99876-1234', sequencia);
    expect(codigoParaWhatsapp(s, '+55 19 99876-1234', sequencia)).toBe(a);
    expect(codigoParaWhatsapp(s, '(11) 98765-4321', sequencia)).not.toBe(a);
  });
  it('troca código guardado inválido e ignora mapa corrompido', () => {
    const s = memoria(); s.setItem('jp-codigos', '{nao é json');
    expect(codigoParaWhatsapp(s, '(19) 99876-1234', () => 'abcdefgh')).toBe('abcdefgh');
    s.setItem('jp-codigos', JSON.stringify({ '19998761234': 'invalido!' }));
    expect(codigoParaWhatsapp(s, '(19) 99876-1234', () => 'cdefghjk')).toBe('cdefghjk');
  });
  it('storage nulo ou que lança: ainda devolve código', () => {
    expect(codigoParaWhatsapp(null, '(19) 99876-1234', () => 'abcdefgh')).toBe('abcdefgh');
    const quebrado = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(codigoParaWhatsapp(quebrado, '(19) 99876-1234', () => 'abcdefgh')).toBe('abcdefgh');
  });
});

describe('links e mensagem', () => {
  it('link com ref e UTMs por meio', () => {
    expect(linkDeIndicacao('https://jornadapet.arrayof.workers.dev/', 'k7m2pq9x', 'whatsapp'))
      .toBe('https://jornadapet.arrayof.workers.dev/?ref=k7m2pq9x&utm_source=indicacao&utm_medium=whatsapp');
    expect(linkDeIndicacao('https://x.dev', 'k7m2pq9x', 'link')).toBe('https://x.dev/?ref=k7m2pq9x&utm_source=indicacao&utm_medium=link');
  });
  it('mensagem na voz do colega, termina no link, sem travessão', () => {
    const m = mensagemDeIndicacao('https://x.dev/?ref=k7m2pq9x');
    expect(m).toBe('Pedi convite para testar a JornadaPet: organiza clientes, agenda e quem ainda falta pagar, tudo pelo Telegram. É feita para adestrador e não custa nada durante o teste. Pede o seu aqui: https://x.dev/?ref=k7m2pq9x');
    expect(m).not.toMatch(/[—–]/);
  });
  it('compartilhar codifica acentos, & e ?', () => {
    const url = linkCompartilharWhatsapp('É feita: https://x.dev/?ref=a&utm_medium=whatsapp');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe('É feita: https://x.dev/?ref=a&utm_medium=whatsapp');
    expect(url).not.toContain('&utm');
  });
  it('WhatsApp da empresa só com número válido', () => {
    expect(linkWhatsappEmpresa('(11) 98765-4321')).toBe('https://wa.me/5511987654321');
    expect(linkWhatsappEmpresa('')).toBeNull();
    expect(linkWhatsappEmpresa('98765-4321')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/indicacao.test.ts`
Expected: FAIL, "Cannot find module '../../src/lib/indicacao'".

- [ ] **Step 3: Implementar**

```ts
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
```

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run tests/unit/indicacao.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/lib/indicacao.ts tests/unit/indicacao.test.ts && git commit -m "feat: módulo de indicação (código por WhatsApp, links com UTMs)"`

---

### Tarefa 3: Worker e banco

**Files:** Modify `src/worker/convite.ts`, `tests/unit/convite.test.ts`; Create `supabase/003_indicacao_e_fila.sql`

**Interfaces:** Consumes `codigoValido` (Tarefa 2). Produces: coluna `codigo_indicacao`; campo `codigo_indicacao` aceito em `/api/convite`.

- [ ] **Step 1: Escrever os testes** (em `tests/unit/convite.test.ts`)

Estender o `servicos()` com a consulta de quem indicou:

```ts
const BUSCA = 'https://proj.supabase.co/rest/v1/convites?select=nome,cidade&codigo_indicacao=eq.k7m2pq9x&limit=1';
// dentro de servicos(): parâmetro indicador: { nome: string; cidade: string } | null | 'erro' = null
if (url === BUSCA) return indicador === 'erro' ? new Response('', { status: 500 }) : Response.json(indicador ? [indicador] : []);
```

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/unit/convite.test.ts` → FAIL nos testes novos.

- [ ] **Step 3: Implementar**

Em `convite.ts`:
- importar `codigoValido` de `../lib/indicacao`;
- depois do laço da origem: `const codigo = texto(bruto.codigo_indicacao); if (codigoValido(codigo)) linha.codigo_indicacao = codigo;`
- no 409: ler o corpo; `if (r.status === 409 && detalhe.includes('convites_whatsapp_por_dia'))` → sucesso; senão segue para o tratamento de erro (502 com código);
- `textoDoAviso(linha, indicador?: string)`: na origem, `ref` com código válido vira `indicador ?? \`Indicação: código ${ref}\``;
- nova função, chamada dentro de `avisarNoTelegram` antes de montar o texto (já roda depois da resposta):

```ts
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
```

  (`cabecalhosSupabase` extrai a montagem de `apikey`/`Authorization` que hoje está no insert; o insert passa a usá-la também, com `Content-Type` e `Prefer`.)

`supabase/003_indicacao_e_fila.sql`:

```sql
-- NT-004. Rodar no SQL Editor ANTES de publicar o Worker que grava codigo_indicacao.

-- Indicação: código aleatório por WhatsApp; índice comum (o único perdia pedidos, NT-004 §2).
alter table public.convites
  add column codigo_indicacao text check (codigo_indicacao ~ '^[a-hjkmnp-z2-9]{8}$');
create index convites_codigo_indicacao on public.convites (codigo_indicacao);

-- Fila: editada à mão no Table Editor.
alter table public.convites
  add column status text not null default 'novo'
    check (status in ('novo', 'chamado', 'convidado', 'ativo', 'desistiu')),
  add column chamado_em timestamptz,
  add column convidado_em timestamptz,
  add column nota text;

-- O aviso no Telegram lê nome e cidade de quem indicou.
grant select (nome, cidade, codigo_indicacao) on public.convites to service_role;

create view public.indicacoes with (security_invoker = true) as
  select quem.nome as indicou, quem.whatsapp as whatsapp_de_quem_indicou,
         chegou.nome as chegou, chegou.whatsapp as whatsapp_de_quem_chegou, chegou.criado_em as chegou_em
  from public.convites chegou
  join public.convites quem on chegou.ref = quem.codigo_indicacao;

-- Pedidos ainda em 'novo' há mais de 3 dias úteis (seg a sex).
create view public.atrasados with (security_invoker = true) as
  select id, criado_em, nome, whatsapp, perfil, cidade
  from public.convites c
  where c.status = 'novo'
    and (select count(*) from generate_series(c.criado_em::date + 1, current_date, interval '1 day') d
         where extract(isodow from d) < 6) > 3
  order by criado_em;

-- Últimos 7 dias por origem e perfil.
create view public.semana_por_origem with (security_invoker = true) as
  select case when ref ~ '^[a-hjkmnp-z2-9]{8}$' then 'indicação'
              when utm_source is not null then utm_source
              else 'direto' end as origem,
         perfil, count(*) as pedidos
  from public.convites
  where criado_em >= now() - interval '7 days'
  group by 1, 2
  order by pedidos desc;

revoke all on public.indicacoes, public.atrasados, public.semana_por_origem from anon, authenticated;
```

- [ ] **Step 4: Rodar e ver passar** — `npm test && npx astro check` → PASS, 0 erros.

- [ ] **Step 5: Commit** — `git add src/worker tests/unit/convite.test.ts supabase/003_indicacao_e_fila.sql && git commit -m "feat: Worker grava a indicação, trata 409 pelo índice e avisa quem indicou"`

---

### Tarefa 4: Tela de sucesso

**Files:** Modify `src/scripts/formulario.ts`, `src/scripts/pagina.ts`, `src/components/Participe.astro`, `src/components/BarraCelular.astro`, `src/data/conteudo.ts`; Create `tests/e2e/indicacao.spec.ts`

**Interfaces:** Consumes Tarefa 2. Produces: estado `codigo`, `linkWhats`, `linkCopia`, `compartilhar`, `copiado`, `mostrarLink`, `aviso`; métodos `copiar()`, `recomecar()` (com foco no nome); evento `pedido-enviado` na `window`; `pagina.pedido`.

- [ ] **Step 1: Escrever os testes**

```ts
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const REGEX = /^[a-hjkmnp-z2-9]{8}$/;

async function enviar(page: Page, corpos: Record<string, string>[], whats = '(19) 99876-1234') {
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp', { exact: true }).fill(whats);
  await page.locator('label.chip-opt', { hasText: 'Adestramento' }).click();
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  const aceite = page.getByLabel(/Aceito ser contatado/);
  if (!(await aceite.isChecked())) await aceite.check();
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeFocused();
}
async function abrir(page: Page, corpos: Record<string, string>[]) {
  await page.route('**/api/convite', async (r) => { corpos.push(r.request().postDataJSON()); await r.fulfill({ json: { success: true } }); });
  await page.goto('/#participe');
}

test('sucesso convida a indicar, com código e UTMs no link do WhatsApp', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  const codigo = corpos[0].codigo_indicacao;
  expect(codigo).toMatch(REGEX);
  await expect(page.getByText('Conhece mais alguém que adestra?')).toBeVisible();
  await expect(page.getByText('Se o seu colega também pedir, vocês entram na mesma turma.')).toBeVisible();
  await expect(page.getByText('em até 3 dias úteis para conversar')).toBeVisible();
  const href = await page.getByRole('link', { name: /Enviar pelo WhatsApp/ }).getAttribute('href');
  const mensagem = decodeURIComponent(href!.replace('https://wa.me/?text=', ''));
  expect(mensagem).toContain(`http://localhost:4321/?ref=${codigo}&utm_source=indicacao&utm_medium=whatsapp`);
  expect(mensagem.startsWith('Pedi convite para testar a JornadaPet')).toBe(true);
});

test('copiar link: área de transferência com utm_medium=link e anúncio único', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByRole('button', { name: 'Copiar link' })).toBeVisible();
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Link copiado.' })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`http://localhost:4321/?ref=${corpos[0].codigo_indicacao}&utm_source=indicacao&utm_medium=link`);
});

test('sem área de transferência: campo do link com foco e seleção', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
    document.execCommand = () => false;
  });
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await page.getByRole('button', { name: 'Copiar link' }).click();
  const campo = page.getByLabel('Seu link');
  await expect(campo).toBeFocused();
  await expect(campo).toHaveValue(`http://localhost:4321/?ref=${corpos[0].codigo_indicacao}&utm_source=indicacao&utm_medium=link`);
  await expect(page.getByText('Toque e segure o link para copiar.')).toBeVisible();
});

test('mesmo aparelho: WhatsApp diferente ganha código diferente; o mesmo reusa', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos);
  await enviar(page, corpos, '(19) 99876-1234');
  await page.getByRole('button', { name: 'Errou algum dado? Enviar de novo' }).click();
  await expect(page.getByLabel('Seu nome')).toBeFocused();
  await enviar(page, corpos, '(11) 98765-4321');
  await page.getByRole('button', { name: 'Errou algum dado? Enviar de novo' }).click();
  await enviar(page, corpos, '(19) 99876-1234');
  expect(corpos[1].codigo_indicacao).not.toBe(corpos[0].codigo_indicacao);
  expect(corpos[2].codigo_indicacao).toBe(corpos[0].codigo_indicacao);
});

test('sem WhatsApp da empresa, sem "Salve nosso número"', async ({ page }) => {
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await expect(page.getByText('Salve nosso número')).toHaveCount(0);
});

test('celular: barra fixa some depois do pedido', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'barra só existe no celular');
  const corpos: Record<string, string>[] = [];
  await abrir(page, corpos); await enviar(page, corpos);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('[x-show*="formVisivel"] .cta')).toBeHidden();
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx playwright test tests/e2e/indicacao.spec.ts` → FAIL nos cinco primeiros e no da barra; o do número passa (trava de regressão).

- [ ] **Step 3: Implementar**

`conteudo.ts`:

```ts
/** WhatsApp da empresa para "Salve nosso número" (NT-004 §5). Vazio: o bloco não aparece. */
export const WHATSAPP_EMPRESA = '';
```

`formulario.ts`:
- importar `codigoParaWhatsapp, linkCompartilharWhatsapp, linkDeIndicacao, mensagemDeIndicacao` de `../lib/indicacao`; `local()` como `sessao()`, com `window.localStorage`;
- estado novo: `codigo: '', linkWhats: '', linkCopia: '', compartilhar: '', copiado: false, mostrarLink: false, aviso: ''` (e na interface);
- no envio, antes de chamar `enviar`: `this.codigo = codigoParaWhatsapp(local(), this.f.whatsapp);` e o corpo ganha `codigo_indicacao: this.codigo`;
- no sucesso, depois de `status = 'ok'`:

```ts
        this.linkWhats = linkDeIndicacao(window.location.origin, this.codigo, 'whatsapp');
        this.linkCopia = linkDeIndicacao(window.location.origin, this.codigo, 'link');
        this.compartilhar = linkCompartilharWhatsapp(mensagemDeIndicacao(this.linkWhats));
        this.$dispatch('pedido-enviado');
```

- métodos:

```ts
    async copiar() {
      clearTimeout(timerCopia);
      let ok = false;
      try { await navigator.clipboard.writeText(this.linkCopia); ok = true; } catch { /* sem API ou sem permissão */ }
      if (!ok) {
        const t = document.createElement('textarea');
        t.value = this.linkCopia; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
        document.body.append(t); t.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        t.remove();
      }
      if (ok) {
        this.copiado = true; this.aviso = 'Link copiado.';
        timerCopia = setTimeout(() => { this.copiado = false; this.aviso = ''; }, 2000);
      } else {
        this.mostrarLink = true; this.aviso = 'Não deu para copiar. O link está no campo abaixo.';
        this.$nextTick(() => { const c = this.$refs.campoLink as HTMLInputElement | undefined; c?.focus(); c?.select(); c?.setSelectionRange(0, 9999); });
      }
    },
    recomecar() {
      this.err = {}; this.status = 'idle'; this.copiado = false; this.mostrarLink = false; this.aviso = '';
      this.$nextTick(() => document.getElementById('f-nome')?.focus());
    },
```

  (`let timerCopia: ReturnType<typeof setTimeout> | undefined;` no topo do módulo. O `recomecar` **mantém** `this.f`: o botão agora é para corrigir o próprio pedido.)

`pagina.ts`: `pedido: false` no estado e na interface. Em `index.astro`, no `div x-data="pagina"`: `@pedido-enviado.window="pedido = true"`. `BarraCelular.astro`: `x-show="!heroCta && !formVisivel && !menu && !pedido"`.

`Participe.astro`, bloco de sucesso (tirar `role="status"` do contêiner); depois do parágrafo do prazo, que passa a terminar em "em até 3 dias úteis para conversar.":

```astro
{numeroEmpresa && (
  <p class="mt-3 max-w-[38ch] text-[16px] leading-relaxed">Salve nosso número para reconhecer a mensagem: <a href={numeroEmpresa} class="font-semibold text-ink underline">{mascararWhatsapp(WHATSAPP_EMPRESA)}</a></p>
)}
<div class="mt-6 w-full r-card border border-line bg-surface p-5">
  <p class="font-semibold text-ink">Conhece mais alguém que adestra?</p>
  <p class="mt-1 text-[16px] leading-relaxed">Mande o link para pedir o convite também.</p>
  <p class="mt-2 text-[14px] leading-relaxed text-mute">Os convites saem aos poucos, em turmas. Se o seu colega também pedir, vocês entram na mesma turma.</p>
  <div class="mt-4 flex flex-col gap-2 sm:flex-row">
    <a :href="compartilhar" :target="matchMedia('(pointer: fine)').matches ? '_blank' : null" rel="noopener"
      class="cta r-ctl inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-3 text-[16px] font-semibold sm:w-auto">
      <Icon name="ph:whatsapp-logo" class="size-5" aria-hidden="true" /> Enviar pelo WhatsApp<span class="sr-only"> (abre o WhatsApp)</span>
    </a>
    <button type="button" @click="copiar()" class="r-ctl inline-flex min-h-11 w-full items-center justify-center gap-2 border border-ink/25 bg-surface px-4 py-3 text-[16px] font-semibold text-ink hover:border-ink/50 sm:w-auto">
      <Icon name="ph:link" class="size-5" x-show="!copiado" aria-hidden="true" /><Icon name="ph:check" class="size-5 text-accent" x-cloak x-show="copiado" aria-hidden="true" /> Copiar link
    </button>
  </div>
  <div x-cloak x-show="mostrarLink" class="mt-3 space-y-1">
    <label for="f-link" class="block text-[14px] font-semibold text-ink">Seu link</label>
    <input id="f-link" x-ref="campoLink" type="text" readonly :value="linkCopia" aria-describedby="h-link" class="field r-ctl w-full px-3 py-2 text-[14px]" />
    <p id="h-link" class="text-[14px] text-mute">Não deu para copiar sozinho. Toque e segure o link para copiar.</p>
  </div>
</div>
<p class="sr-only" aria-live="polite" x-text="aviso"></p>
<button type="button" class="mt-4 inline-flex min-h-11 items-center text-[14px] font-medium text-ink underline decoration-line decoration-2 hover:decoration-accent" @click="recomecar()">Errou algum dado? Enviar de novo</button>
```

  Frontmatter: `import { CONTATO_EMAIL, WHATSAPP_EMPRESA } from '../data/conteudo';`, `import { linkWhatsappEmpresa } from '../lib/indicacao';`, `import { mascararWhatsapp } from '../lib/whatsapp';`, `const numeroEmpresa = linkWhatsappEmpresa(WHATSAPP_EMPRESA);`. Se o cartão novo apertar o bloco, trocar `min-h-[420px]` por `min-h-[480px]`.

  Ajustar `formulario.spec.ts` se algum teste usar "Enviar outro contato".

- [ ] **Step 4: Rodar e ver passar** — `npx playwright test tests/e2e/indicacao.spec.ts tests/e2e/formulario.spec.ts tests/e2e/qualidade.spec.ts` → PASS, inclusive o axe nos dois temas. Conferir em captura a tela de sucesso a 360 px e a 1440 px, nos dois temas.

- [ ] **Step 5: Commit** — `git add src tests && git commit -m "feat: tela de sucesso convida a indicar (código por WhatsApp, cópia em três degraus)"`

---

### Tarefa 5: Web Analytics, política, documentação e verificação final

**Files:** Modify `src/data/conteudo.ts`, `src/layouts/Base.astro`, `src/pages/privacidade.astro`, `tests/e2e/fixtures.ts`, `tests/e2e/seo.spec.ts`, `docs/README.md`

- [ ] **Step 1: Escrever os testes** (em `tests/e2e/seo.spec.ts`)

```ts
test('sem token, a página não carrega o Web Analytics', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[src*="cloudflareinsights"]')).toHaveCount(0);
});

test('política cita indicação, armazenamento local e Web Analytics', async ({ page }) => {
  await page.goto('/privacidade');
  const main = page.locator('main');
  for (const t of ['código aleatório de indicação', 'armazenamento local do navegador', 'Cloudflare Web Analytics', 'sem cookies', 'Atualizada em 13 de outubro de 2026.']) {
    await expect(main).toContainText(t);
  }
});
```

Em `fixtures.ts`, no mesmo `auto` fixture, acrescentar uma rota que responde vazio para `https://static.cloudflareinsights.com/**` (os testes não dependem da rede quando o token for preenchido).

- [ ] **Step 2: Rodar e ver falhar** — `npx playwright test tests/e2e/seo.spec.ts --project=desktop` → FAIL no teste da política.

- [ ] **Step 3: Implementar**

`conteudo.ts`:

```ts
/** Token público do Cloudflare Web Analytics (NT-004 §5). Vazio: nenhum script de medição. */
export const CLOUDFLARE_ANALYTICS_TOKEN = '';
```

`Base.astro`, antes do `</body>`:

```astro
{CLOUDFLARE_ANALYTICS_TOKEN && (
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN })}></script>
)}
```

`privacidade.astro`:
- `ATUALIZADA_EM = '13 de outubro de 2026'`;
- "O que coletamos", novo item depois da origem: "Um código aleatório de indicação, que vai no link que você pode mandar a um colega. Ele não contém nenhum dado seu e serve só para sabermos quem indicou quem.";
- "Com quem os dados são tratados", no item da Cloudflare: acrescentar "e mede as visitas à página com o Cloudflare Web Analytics, sem cookies e sem identificar você.";
- "O que fica no seu navegador": "Esta página não usa cookies próprios nem ferramentas de publicidade. Medimos as visitas com o Cloudflare Web Analytics, sem cookies e sem identificar você. Se você chegar por um link com origem (utm ou ref), guardamos essa origem no armazenamento da aba, que é apagado quando a aba é fechada. O seu código aleatório de indicação fica no armazenamento local do navegador, para o link continuar o mesmo se você voltar. A verificação contra robôs da Cloudflare pode ler informações técnicas do navegador no momento do envio."

`docs/README.md`: seção "Copy v2, indicação e fila — 2026-10-13" com links para NT-003, NT-004, spec e plano, e a linha na tabela de frentes.

- [ ] **Step 4: Verificação final** — `npm test && npx playwright test && npx wrangler deploy --dry-run` → tudo verde; Worker empacota.

- [ ] **Step 5: Commit (sem push)** — `git add src tests docs && git commit -m "feat: Web Analytics opcional; política cita indicação e medição"`

## Checklist de publicação (bloqueia o push)

1. Rodar `supabase/003_indicacao_e_fila.sql` no SQL Editor. Conferir no Table Editor as colunas novas e as views `indicacoes`, `atrasados` e `semana_por_origem`.
2. `git push`; esperar o deploy.
3. Ver o HTML publicado: `og:url`, `og:image` e canonical no `workers.dev`; JSON-LD sem e-mail.
4. Pedido real; "Enviar pelo WhatsApp" para si mesmo: conferir o preview (título, descrição, imagem). Abrir o link em outro navegador e fazer um segundo pedido com outro WhatsApp: o aviso no Telegram diz "Indicação de …" e a view `indicacoes` mostra a ligação.
5. Aparelho real: "Enviar pelo WhatsApp" e "Copiar link" no Android Chrome, no iOS Safari e nos navegadores internos do Instagram e do WhatsApp.
6. Web Analytics: criar o site no painel do Cloudflare (Analytics e logs → Web Analytics), pôr o token em `CLOUDFLARE_ANALYTICS_TOKEN`, commit e push.
7. Combinar a rotina: `atrasados` todo dia útil, `semana_por_origem` às segundas, atualizar `status` a cada contato.
