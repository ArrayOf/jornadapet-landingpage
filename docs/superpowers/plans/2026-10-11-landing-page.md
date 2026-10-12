# Landing page da JornadaPet — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** portar o protótipo v2 da NT-001 para um site estático em Astro (página `/`, `/privacidade`, `/obrigado` e `404`), com formulário de pedido de convite que funciona com e sem JS, SEO, acessibilidade AA e o design system do `DESIGN.md`.

**Architecture:** Astro gera HTML estático; todo conteúdo legível (passos, perfis, perguntas, sócios) é dado tipado em `src/data/` renderizado no build. Regras (máscara, validação, origem UTM, montagem e envio do formulário) são funções puras em `src/lib/`, testadas com Vitest. O Alpine.js só guarda estado de interface (menu, aba ativa, envio) e chama `src/lib/`; os comportamentos de página são verificados com Playwright contra o `astro preview`.

**Tech Stack:** Node 24, Astro 7.3.5, Tailwind CSS 4.3.3 (`@tailwindcss/vite`), Alpine.js 3.17.4 (`@astrojs/alpinejs` 1.0.0, plugins `intersect` e `focus`), `astro-icon` 1.2.0 + `@iconify-json/ph` 1.2.2, Fontsource variável (Bricolage Grotesque e Instrument Sans 5.3.0), `@astrojs/sitemap` 3.7.4, TypeScript 5.9.3 + `@astrojs/check` 0.9.10, Vitest 5.0.2, Playwright 1.63.0 + `@axe-core/playwright` 4.13.0, serviço de formulário Web3Forms.

**Spec:** [`../specs/2026-10-11-landing-page-design.md`](../specs/2026-10-11-landing-page-design.md). Referência de comportamento, texto e visual onde a spec é omissa: [`../../notas-tecnicas/prototipos/NT-001-landing-page-v2.html`](../../notas-tecnicas/prototipos/NT-001-landing-page-v2.html). Tokens e regras visuais: [`../../../DESIGN.md`](../../../DESIGN.md). Contexto e decisões: [`NT-001`](../../notas-tecnicas/NT-001-landing-page.md).

## Global Constraints

- A spec é a autoridade; onde ela é omissa, vale o protótipo v2; onde o protótipo tem coisa de protótipo (painel "Protótipo", envio simulado, CDN), vale a spec.
- Versões **exatas** (sem `^`/`~`) como no Tech Stack; `typescript` é **5.9.3** (o `@astrojs/check` não aceita a 7).
- Paleta E do `DESIGN.md`: oliva `#3f5a2c` é a **única** cor de ação (escuro `#a3c47f` com texto `#17200f`); caramelo `#d17c3a` nunca em texto ou botão; pastéis só com o significado do `DESIGN.md`.
- Três raios: 12px (`.r-ctl`), 16px (`.r-card`), pílula. Escala de texto: 12, 14, 16, 18, 20, 28px + os dois `clamp()` do `DESIGN.md`.
- Fontes por CSS custom properties `--f-display` e `--f-sans` (**nunca** declarar `--font-display`/`--font-sans` à mão: o Tailwind as anula; NT-001 §7). Famílias do Fontsource: `"Bricolage Grotesque Variable"` e `"Instrument Sans Variable"`.
- Rótulos de ação: **"Quero testar"** (menu, hero, faixa do "Como funciona", barra fixa) e **"Pedir meu convite"** (botão do formulário). Nenhum outro.
- Texto visível **sem travessão** (— ou –). "tutor" e "pet" em minúsculas no texto corrido. Texto igual ao do protótipo v2.
- Todo conteúdo legível no HTML estático. Proibido `x-for` e `x-text` para conteúdo (só para estado: nome no sucesso, mensagens de erro).
- Conteúdo **visível por padrão**: nenhuma animação começa em `opacity: 0` para conteúdo; revelação no scroll só com `transform`. Hero (texto e foto) anima só `transform`.
- `prefers-reduced-motion` → classe `rm` no `<html>` → nada anima e o passo a passo não troca sozinho; `prefers-reduced-transparency` → classe `solid` → vidro sólido.
- Ícones só por `astro-icon` (`ph:*`, preenchidos `ph:*-fill`), em `aria-hidden`. Nada de fonte de ícones, nada de emoji como ícone.
- Formulário: endpoint e chave por ambiente — `PUBLIC_FORM_ENDPOINT` (padrão `https://api.web3forms.com/submit`), `PUBLIC_FORM_ACCESS_KEY`, `PUBLIC_SITE_URL` (padrão `https://jornadapet.com.br`), `PUBLIC_INDEXAR` (padrão `false`; só `true` em produção).
- Nada do formulário vai para `console`, URL ou analytics. Sem analytics.
- Git: o disco E: não registra dono; rode git com `git -c safe.directory=E:/ArrayOF/jp/landing_page …` (ou peça ao usuário para adicionar o `safe.directory` global). Toda mensagem de commit termina com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Não adicione `.claude/`, `.superpowers/`, `.playwright-mcp/` nem `references/` aos commits de código (os três primeiros estão no `.gitignore`; `references/` vai num commit próprio de documentação na Tarefa 1).
- Comandos: `npm test` (Vitest), `npm run test:e2e` (Playwright; faz build e sobe o preview sozinho), `npm run check` (astro check). Antes do primeiro e2e: `npx playwright install chromium`.

## Review Focus

1. **WhatsApp digitado ou colado em formatos reais** (`+55 11 98765-4321`, `011 98765-4321`, `(11)98765 4321`, fixo de 10 dígitos): vira `(11) 98765-4321` e passa; 9 dígitos sem DDD não passa. → Tarefa 2 (`whatsapp.test.ts`).
2. **Visitante sem JS** (bloqueador, navegador interno de app): o formulário faz `POST` ao serviço e cai em `/obrigado`; FAQ, passos e perfis aparecem. → Tarefa 7 (`passos aparecem sem JS`), Tarefa 9 (`envia sem JS e chega ao obrigado`), Tarefa 10 (`dúvidas abrem sem JS`).
3. **Serviço do formulário fora do ar, lento ou respondendo `success: false`**: aparece o erro, os dados ficam, e dá para tentar de novo. → Tarefa 4 (`enviar` com 500, `success:false`, rede caindo, tempo esgotado) e Tarefa 9 (`erro do serviço mantém os dados`).
4. **`sessionStorage` bloqueado** (aba anônima, cookies bloqueados): a origem UTM simplesmente não persiste, e o formulário funciona. → Tarefa 4 (`guardarOrigem com storage que lança`).
5. **Duplo clique em "Pedir meu convite"**: um envio só. → Tarefa 9 (`duplo clique envia uma vez`).

---

## Desvios da execução (12/10/2026)

Registrados no ledger da execução como `Ruling:`; os principais:

- **Marca (fora do plano):** a NT-002 trocou o símbolo "J-guia" pelo mascote caramelo. O
  `Simbolo.astro` passou a usar a cabeça do mascote (`src/assets/marca/cabeca.png`, otimizada pelo
  Astro); `public/favicon.svg`, `scripts/gerar-og.mjs` e `tests/og/og.html` saíram, e entraram os
  PNGs da NT-002 (`favicon-16/32`, `apple-touch-icon`, `icon-192/512`, `og.png`). Token
  `caramelo` → `#dba05a` e tokens de ilustração `orelha`, `creme`, `lingua`.
- **Passo a passo:** foco das setas síncrono (não em `$nextTick`) e `x-cloak` condicional por
  spread (o Astro gravava `x-cloak="false"`).
- **Reduzir movimento:** `html.rm` também zera transições, não só animações.
- **Tipos:** `src/types/alpine-plugins.d.ts` para os plugins do Alpine; `playwright-core` fixado
  em 1.63.0 para o `@axe-core/playwright`.
- **Testes ajustados** (seletores ambíguos, valores do Alpine, medição do axe com movimento
  reduzido): ver o ledger.

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
| --- | --- | --- |
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example` | Criar (T1) | Ferramentas, integrações, testes |
| `src/styles/global.css` | Criar (T1) | Tailwind, `@theme inline`, tokens claro/escuro, utilitários do `DESIGN.md`, motion |
| `src/layouts/Base.astro` | Criar (T1), reescrever (T11) | `<html>`, `<head>` (tema, fontes, SEO), skip link |
| `src/scripts/alpine.ts` | Criar (T1), modificar (T5, T7, T9) | Entrada do Alpine: plugins e `Alpine.data` |
| `src/scripts/tipos.ts` | Criar (T5) | Tipo `Magia` (propriedades `$…` do Alpine) |
| `src/lib/whatsapp.ts` | Criar (T2) | Normalização, máscara e validade do WhatsApp |
| `src/lib/validacao.ts` | Criar (T3) | Campos, perfis, mensagens, validação, ordem de foco |
| `src/lib/utm.ts` | Criar (T4) | Ler e guardar a origem (UTM e `ref`) |
| `src/lib/formulario.ts` | Criar (T4) | Montar o corpo e enviar ao serviço |
| `src/data/conteudo.ts` | Criar (T5), modificar (T7, T8, T10) | Conteúdo da página como dados |
| `src/components/Simbolo.astro` | Criar (T5) | Símbolo "J-guia" |
| `src/components/Nav.astro`, `Rodape.astro`, `BarraCelular.astro` | Criar (T5) | Navegação, menu do celular, rodapé, barra fixa |
| `src/scripts/pagina.ts` | Criar (T5) | Estado da página: menu, `scrolled`, `heroCta`, `formVisivel` |
| `src/components/Hero.astro` | Criar (T6) | Hero |
| `src/components/ComoFunciona.astro`, `src/scripts/stepper.ts` | Criar (T7) | Passo a passo |
| `src/components/Previa.astro`, `ParaQuem.astro`, `EmEstudo.astro`, `Sobre.astro` | Criar (T8) | Seções de conteúdo |
| `src/components/Participe.astro`, `src/scripts/formulario.ts`, `src/pages/obrigado.astro` | Criar (T9) | Formulário e confirmação |
| `src/components/Duvidas.astro` | Criar (T10) | Perguntas com `<details>` |
| `src/lib/jsonld.ts`, `src/pages/privacidade.astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`, `public/favicon.svg`, `public/site.webmanifest`, `scripts/gerar-og.mjs`, `tests/og/og.html` | Criar (T11) | SEO e páginas de apoio |
| `src/assets/*.jpg` | Criar (T6, T8) | Fotos (copiadas de `docs/notas-tecnicas/prototipos/NT-001-assets/`) |
| `src/pages/index.astro` | Criar (T1), modificar (T5–T10) | Monta as seções |
| `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts` | Criar (T1–T12) | Testes |

---

## Antes de começar

- [ ] Ler a spec inteira, a §3 do `DESIGN.md` (Colors) e abrir o protótipo v2 no navegador (`python -m http.server 8765` em `docs/notas-tecnicas/prototipos/` e `http://127.0.0.1:8765/NT-001-landing-page-v2.html`).
- [ ] Conferir Node ≥ 22.12 (`node -v`) e que `E:/ArrayOF/jp/landing_page` é o repositório (`git -c safe.directory=E:/ArrayOF/jp/landing_page status`).

---

### Tarefa 1: Base do projeto — Astro, Tailwind, Alpine, tokens e testes

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/scripts/alpine.ts`, `src/pages/index.astro`, `tests/unit/sanidade.test.ts`, `tests/e2e/base.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: layout `Base` com props `{ title: string; description: string; noindex?: boolean }`; classes globais `.r-ctl`, `.r-card`, `.glass`, `.blob .b1/.b2/.b3`, `.cta`, `.seta`, `.note .n1/.n2`, `.hero-in`, `.hero-photo`, `.wave`, `[data-reveal]`/`.in`, `.stage-card[data-on]`, `.step-progress.run`, `.paused`, `.bento-tile`, `.field`, `.chip-opt`, `[x-cloak]`; cores Tailwind `bg`, `surface`, `ink`, `body`, `mute`, `line`, `accent`, `accent-ink`, `mint`, `sky`, `butter`, `peach`, `lilac`, `danger`, `caramelo`; classes no `<html>`: `js`/`no-js`, `dark`, `rm`, `solid`.

- [ ] **Step 1: Commitar a documentação que já existe (antes de qualquer código)**

```bash
cd E:/ArrayOF/jp/landing_page
git -c safe.directory=E:/ArrayOF/jp/landing_page add .gitignore DESIGN.md docs references skills-lock.json
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "docs: NT-001, DESIGN.md, spec e plano da landing page

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 2: Criar `package.json`**

```json
{
  "name": "jornadapet-landing",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview --port 4321",
    "check": "astro check",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "og": "node scripts/gerar-og.mjs"
  },
  "dependencies": {
    "@alpinejs/focus": "3.17.4",
    "@alpinejs/intersect": "3.17.4",
    "@astrojs/alpinejs": "1.0.0",
    "@astrojs/sitemap": "3.7.4",
    "@fontsource-variable/bricolage-grotesque": "5.3.0",
    "@fontsource-variable/instrument-sans": "5.3.0",
    "@iconify-json/ph": "1.2.2",
    "@tailwindcss/vite": "4.3.3",
    "alpinejs": "3.17.4",
    "astro": "7.3.5",
    "astro-icon": "1.2.0",
    "tailwindcss": "4.3.3"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.63.0",
    "@types/alpinejs": "3.13.11",
    "typescript": "5.9.3",
    "vitest": "5.0.2"
  }
}
```

Run: `npm install` — Expected: termina sem `ERESOLVE`.

- [ ] **Step 3: Configurações**

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import alpinejs from '@astrojs/alpinejs';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL ?? 'https://jornadapet.com.br';

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    alpinejs({ entrypoint: '/src/scripts/alpine' }),
    icon({ include: { ph: ['*'] } }),
    sitemap({ filter: (page) => !page.includes('/obrigado') && !page.includes('/404') }),
  ],
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "docs", "references"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'] } });
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PUBLIC_FORM_ACCESS_KEY: 'chave-de-teste', PUBLIC_INDEXAR: 'false', PUBLIC_SITE_URL: 'http://localhost:4321' },
  },
});
```

`.env.example`:

```bash
# Serviço do formulário (Web3Forms por padrão; spec §2.7)
PUBLIC_FORM_ENDPOINT=https://api.web3forms.com/submit
PUBLIC_FORM_ACCESS_KEY=
# URL pública do site (canonical, sitemap, Open Graph)
PUBLIC_SITE_URL=https://jornadapet.com.br
# Só "true" em produção; fora dela a página sai com noindex
PUBLIC_INDEXAR=false
```

Acrescente ao `.gitignore`:

```gitignore
.env
test-results/
playwright-report/
```

- [ ] **Step 4: `src/styles/global.css` (tokens e utilitários do `DESIGN.md`)**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --font-display: var(--f-display);
  --font-sans: var(--f-sans);
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-body: var(--body);
  --color-mute: var(--mute);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --color-caramelo: var(--caramelo);
  --color-mint: var(--mint);
  --color-butter: var(--butter);
  --color-peach: var(--peach);
  --color-sky: var(--sky);
  --color-lilac: var(--lilac);
  --color-danger: var(--danger);
}

/* Paleta E (DESIGN.md). mint = clientes, sky = agenda, butter = a receber, peach = falta, lilac = em estudo. */
:root {
  --f-display: "Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif;
  --f-sans: "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --bg: #f4f4f6; --surface: #ffffff; --ink: #23251f; --body: #45473f; --mute: #676a60; --line: #e2e2e6;
  --accent: #3f5a2c; --accent-ink: #ffffff; --danger: #b42318; --caramelo: #d17c3a;
  --mint: #e1e7d6; --butter: #f2e2cf; --peach: #efdcd2; --sky: #e0e0ea; --lilac: #e7e4ec;
  --blob-1: #ecd2b2; --blob-2: #cdd6bd; --blob-3: #dcdce6; --blob-op: .9;
  --glass: rgba(255,255,255,.58); --glass-edge: rgba(255,255,255,.85); --glass-hi: rgba(255,255,255,.9);
  --shadow: 0 18px 40px -22px rgba(64,48,32,.35);
  --cta: #3f5a2c; --cta-ink: #ffffff;
  color-scheme: light;
}
.dark {
  --bg: #151613; --surface: #1d1f1a; --ink: #f1f2ec; --body: #cfd1c7; --mute: #a0a395; --line: #2e3128;
  --accent: #a3c47f; --accent-ink: #17200f; --danger: #ff8a80; --caramelo: #e09a5f;
  --mint: #283222; --butter: #3a2e20; --peach: #3a2823; --sky: #282a33; --lilac: #2d2a33;
  --blob-1: #5c3f22; --blob-2: #34452a; --blob-3: #2c2d3a; --blob-op: .55;
  --glass: rgba(32,32,36,.55); --glass-edge: rgba(255,255,255,.10); --glass-hi: rgba(255,255,255,.08);
  --shadow: 0 18px 40px -22px rgba(0,0,0,.7);
  --cta: #a3c47f; --cta-ink: #17200f;
  color-scheme: dark;
}

@layer base {
  html { scroll-behavior: smooth; scroll-padding-top: 5rem; -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; scrollbar-color: var(--line) transparent; }
  html.rm { scroll-behavior: auto; }
  a, button, label, input, select, summary { touch-action: manipulation; }
  body { background: var(--bg); color: var(--body); font-family: var(--f-sans); }
  h1, h2, h3, .display { font-family: var(--f-display); color: var(--ink); text-wrap: balance; letter-spacing: -0.025em; }
  p { text-wrap: pretty; }
  ::selection { background: var(--mint); color: var(--ink); }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  input, select, textarea { caret-color: var(--accent); }
  a { text-underline-offset: 3px; }
}

.r-card { border-radius: 16px; }
.r-ctl { border-radius: 12px; }

.glass {
  background: var(--glass);
  -webkit-backdrop-filter: blur(16px) saturate(140%); backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--glass-edge);
  box-shadow: inset 0 1px 0 var(--glass-hi), var(--shadow);
}
.solid .glass { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; border-color: var(--line); }

.blob { position: absolute; border-radius: 9999px; filter: blur(48px); opacity: var(--blob-op); pointer-events: none; will-change: transform; }
.blob.b1 { background: var(--blob-1); } .blob.b2 { background: var(--blob-2); } .blob.b3 { background: var(--blob-3); }

.cta { background: var(--cta); color: var(--cta-ink); transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1); }
.cta:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -12px color-mix(in oklab, var(--cta) 70%, transparent); }
.cta:active { transform: translateY(0) scale(.98); }
.cta .seta { transition: transform .25s cubic-bezier(.16,1,.3,1); }
.cta:hover .seta { transform: translateX(3px); }

/* Motion: conteúdo nunca começa invisível; hero e revelação só deslizam (spec §5). */
@keyframes subir { from { transform: translateY(14px); } to { transform: none; } }
@keyframes pousar { from { opacity: 0; transform: translateY(16px) rotate(var(--r,0deg)) scale(.97); } to { opacity: 1; transform: rotate(var(--r,0deg)); } }
@keyframes flutuar { 0%,100% { transform: rotate(var(--r,0deg)) translateY(0); } 50% { transform: rotate(var(--r,0deg)) translateY(-5px); } }
@keyframes derivar { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-28px,22px) scale(1.12); } }
@keyframes encher { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.note { transform: rotate(var(--r,0deg)); }
html:not(.rm) .hero-in > * { animation: subir .8s cubic-bezier(.16,1,.3,1) both; }
html:not(.rm) .hero-in > *:nth-child(2) { animation-delay: .07s; }
html:not(.rm) .hero-in > *:nth-child(3) { animation-delay: .14s; }
html:not(.rm) .hero-in > *:nth-child(4) { animation-delay: .21s; }
html:not(.rm) .hero-photo { animation: subir 1s cubic-bezier(.16,1,.3,1) .1s both; }
html:not(.rm) .note { animation: pousar .8s cubic-bezier(.16,1,.3,1) both, flutuar 7s ease-in-out infinite; }
html:not(.rm) .note.n1 { animation-delay: .45s, 1.25s; }
html:not(.rm) .note.n2 { animation-delay: .65s, 1.6s; }
html:not(.rm) .blob { animation: derivar 16s ease-in-out infinite; }
html:not(.rm) .blob.b2 { animation-duration: 19s; animation-direction: reverse; }
html:not(.rm) .blob.b3 { animation-duration: 23s; }

html.js:not(.rm) [data-reveal] { transform: translateY(18px); transition: transform .8s cubic-bezier(.16,1,.3,1); transition-delay: calc(var(--i, 0) * 90ms); }
html.js:not(.rm) [data-reveal].in { transform: none; }

/* Passo a passo. Sem JS, os três painéis aparecem empilhados. */
.stage-card { transition: opacity .55s cubic-bezier(.16,1,.3,1), transform .55s cubic-bezier(.16,1,.3,1), filter .55s cubic-bezier(.16,1,.3,1); }
.stage-card[data-on="false"] { opacity: 0; transform: translateY(14px) scale(.98); filter: blur(6px); pointer-events: none; }
html.rm .stage-card { transition: none; filter: none !important; }
html.no-js .palco { min-height: 0; }
html.no-js .stage-card { position: relative; inset: auto; opacity: 1 !important; transform: none !important; filter: none !important; pointer-events: auto !important; margin-top: 1rem; }
.step-progress { transform-origin: left; transform: scaleX(0); }
html:not(.rm) .step-progress.run { animation: encher var(--dur, 6s) linear forwards; }
html.rm .step-progress.run { transform: scaleX(1); }
.paused .step-progress.run { animation-play-state: paused; }

.bento-tile img { transition: transform .9s cubic-bezier(.16,1,.3,1); }
html:not(.rm) .bento-tile:hover img { transform: scale(1.04); }

.field { background: var(--surface); border: 1px solid var(--line); color: var(--ink); transition: border-color .2s, box-shadow .2s; }
.field::placeholder { color: var(--mute); }
.field:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent); }
.field[aria-invalid="true"] { border-color: var(--danger); }
.chip-opt input { position: absolute; opacity: 0; pointer-events: none; }
.chip-opt span { border: 1px solid var(--line); background: var(--surface); color: var(--body); transition: background .2s, color .2s, border-color .2s; }
.chip-opt input:checked + span { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.chip-opt input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }

details[open] > summary .mais { rotate: 45deg; }
summary { list-style: none; } summary::-webkit-details-marker { display: none; }

[x-cloak] { display: none !important; }
```

- [ ] **Step 5: `src/layouts/Base.astro`, `src/scripts/alpine.ts`, `src/pages/index.astro`**

`src/layouts/Base.astro`:

```astro
---
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '../styles/global.css';

interface Props { title: string; description: string; noindex?: boolean }
const { title, description, noindex = false } = Astro.props;
const indexar = import.meta.env.PUBLIC_INDEXAR === 'true' && !noindex;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="pt-BR" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {!indexar && <meta name="robots" content="noindex, nofollow" />}
    <meta name="theme-color" content="#f4f4f6" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#151613" media="(prefers-color-scheme: dark)" />
    <script is:inline>
      (function () {
        var h = document.documentElement;
        var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
        h.classList.remove('no-js'); h.classList.add('js');
        if (mm('(prefers-color-scheme: dark)')) h.classList.add('dark');
        if (mm('(prefers-reduced-motion: reduce)')) h.classList.add('rm');
        if (mm('(prefers-reduced-transparency: reduce)')) h.classList.add('solid');
        if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) { h.classList.toggle('dark', e.matches); });
      })();
    </script>
  </head>
  <body class="antialiased">
    <a href="#conteudo" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-surface text-ink px-4 py-2 r-ctl">Pular para o conteúdo</a>
    <slot />
  </body>
</html>
```

`src/scripts/alpine.ts`:

```ts
import type { Alpine } from 'alpinejs';
import intersect from '@alpinejs/intersect';
import focus from '@alpinejs/focus';

export default (Alpine: Alpine) => {
  Alpine.plugin(intersect);
  Alpine.plugin(focus);
};
```

`src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="JornadaPet: agenda e clientes para adestradores de cães" description="Organize tutores, pets, sessões e valores a receber do seu trabalho de adestramento no Telegram, sem instalar outro app. Acesso por convite.">
  <main id="conteudo"><h1 class="text-[clamp(2.3rem,4.4vw,3.6rem)] font-bold leading-[1.04]">Adestrador: saiba quem já pagou e quem ainda falta.</h1></main>
</Base>
```

- [ ] **Step 6: Testes de base (escrever, ver falhar se o build não existir, ver passar)**

`tests/unit/sanidade.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('sanidade', () => {
  it('roda o Vitest', () => { expect(1 + 1).toBe(2); });
});
```

`tests/e2e/base.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('carrega em pt-BR, com fontes e sem erro no console', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Bricolage Grotesque Variable/);
  await expect(page.locator('body')).toHaveCSS('font-family', /Instrument Sans Variable/);
  expect(erros).toEqual([]);
});

test('tema escuro do sistema aplica a classe dark e os tokens escuros', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(21, 22, 19)');
});

test('reduzir movimento aplica a classe rm', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\brm\b/);
});

test('fora de produção sai com noindex', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});
```

Run: `npm test` — Expected: 1 passed.
Run: `npx playwright install chromium` e depois `npm run test:e2e -- tests/e2e/base.spec.ts` — Expected: 8 passed (4 testes × 2 projetos).

- [ ] **Step 7: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts .env.example .gitignore src tests
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: base Astro com Tailwind, Alpine, tokens da paleta E e testes

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 2: WhatsApp — normalizar, mascarar, validar

**Files:**
- Create: `src/lib/whatsapp.ts`
- Test: `tests/unit/whatsapp.test.ts`

**Interfaces:**
- Produces: `digitosWhatsapp(entrada: string): string`, `mascararWhatsapp(entrada: string): string`, `whatsappValido(entrada: string): boolean`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { describe, expect, it } from 'vitest';
import { digitosWhatsapp, mascararWhatsapp, whatsappValido } from '../../src/lib/whatsapp';

describe('digitosWhatsapp', () => {
  it.each([
    ['(11) 98765-4321', '11987654321'],
    ['+55 11 98765-4321', '11987654321'],
    ['55 (11) 98765-4321', '11987654321'],
    ['011 98765-4321', '11987654321'],
    ['(11)98765 4321', '11987654321'],
    ['(11) 3456-7890', '1134567890'],
    ['11 98765-43219999', '11987654321'],
    ['', ''],
  ])('%s → %s', (entrada, esperado) => { expect(digitosWhatsapp(entrada)).toBe(esperado); });
});

describe('mascararWhatsapp', () => {
  it.each([
    ['11987654321', '(11) 98765-4321'],
    ['+55 11 98765-4321', '(11) 98765-4321'],
    ['1134567890', '(11) 3456-7890'],
    ['119876', '(11) 9876'],
    ['11', '11'],
    ['1', '1'],
    ['', ''],
  ])('%s → %s', (entrada, esperado) => { expect(mascararWhatsapp(entrada)).toBe(esperado); });

  it('é estável ao reaplicar', () => {
    const uma = mascararWhatsapp('11987654321');
    expect(mascararWhatsapp(uma)).toBe(uma);
  });
});

describe('whatsappValido', () => {
  it.each(['(11) 98765-4321', '+55 11 98765-4321', '011 98765-4321', '(11) 3456-7890'])('aceita %s', (v) => {
    expect(whatsappValido(v)).toBe(true);
  });
  it.each(['98765-4321', '(11) 9876', '', 'abc'])('recusa %s', (v) => { expect(whatsappValido(v)).toBe(false); });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/whatsapp.test.ts` — Expected: FAIL, `Failed to resolve import "../../src/lib/whatsapp"`.

- [ ] **Step 3: Implementar**

```ts
/** Só os dígitos do número, sem +55 nem 0 de operadora, no máximo 11 (DDD + número). */
export function digitosWhatsapp(entrada: string): string {
  let d = entrada.replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  if (d.length > 11 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 11);
}

/** Máscara progressiva: (11) 98765-4321 ou (11) 3456-7890. */
export function mascararWhatsapp(entrada: string): string {
  const d = digitosWhatsapp(entrada);
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

/** DDD + 8 ou 9 dígitos. */
export function whatsappValido(entrada: string): boolean {
  return /^\d{10,11}$/.test(digitosWhatsapp(entrada));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/whatsapp.test.ts` — Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src/lib/whatsapp.ts tests/unit/whatsapp.test.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: normalizacao, mascara e validacao do WhatsApp

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 3: Validação do formulário

**Files:**
- Create: `src/lib/validacao.ts`
- Test: `tests/unit/validacao.test.ts`

**Interfaces:**
- Consumes: `whatsappValido` (Tarefa 2).
- Produces: `type Campo = 'nome' | 'whatsapp' | 'perfil' | 'cidade' | 'aceite'`; `ORDEM_DOS_CAMPOS: readonly Campo[]`; `PERFIS: readonly string[]`; `interface Dados { nome: string; whatsapp: string; perfil: string; cidade: string; aceite: boolean }`; `type Erros = Partial<Record<Campo, string>>`; `MENSAGENS: Record<Campo, string>`; `validarCampo(campo: Campo, dados: Dados): string` (`''` = ok); `validar(dados: Dados): Erros` (só campos com erro); `primeiroCampoComErro(erros: Erros): Campo | undefined`.

- [ ] **Step 1: Testes que falham**

```ts
import { describe, expect, it } from 'vitest';
import { MENSAGENS, ORDEM_DOS_CAMPOS, PERFIS, primeiroCampoComErro, validar, validarCampo, type Dados } from '../../src/lib/validacao';

const ok: Dados = { nome: 'Camila Duarte', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: 'Campinas, SP', aceite: true };

describe('validarCampo', () => {
  it('aceita dados completos', () => {
    for (const c of ORDEM_DOS_CAMPOS) expect(validarCampo(c, ok)).toBe('');
  });
  it.each([
    ['nome', { nome: ' A ' }],
    ['nome', { nome: '' }],
    ['whatsapp', { whatsapp: '98765-4321' }],
    ['perfil', { perfil: '' }],
    ['perfil', { perfil: 'Astronauta' }],
    ['cidade', { cidade: ' SP ' }],
    ['aceite', { aceite: false }],
  ] as const)('recusa %s inválido', (campo, troca) => {
    expect(validarCampo(campo, { ...ok, ...troca })).toBe(MENSAGENS[campo]);
  });
});

describe('validar e foco', () => {
  it('não devolve nada quando está tudo certo', () => { expect(validar(ok)).toEqual({}); });
  it('o primeiro erro segue a ordem da tela, não a ordem de digitação', () => {
    const erros = validar({ ...ok, cidade: '', perfil: '' });
    expect(Object.keys(erros).sort()).toEqual(['cidade', 'perfil']);
    expect(primeiroCampoComErro(erros)).toBe('perfil');
  });
  it('sem erros, sem campo', () => { expect(primeiroCampoComErro({})).toBeUndefined(); });
});

describe('textos', () => {
  it('perfis e mensagens são os do protótipo v2', () => {
    expect(PERFIS).toEqual(['Adestramento', 'Passeio ou pet sitter', 'Creche ou hotel', 'Banho e tosa', 'Veterinária', 'Outro']);
    expect(MENSAGENS.whatsapp).toBe('Confira o número com DDD, por exemplo (11) 98765-4321.');
    for (const m of Object.values(MENSAGENS)) expect(m).not.toMatch(/[—–]/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/validacao.test.ts` — Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

```ts
import { whatsappValido } from './whatsapp';

export type Campo = 'nome' | 'whatsapp' | 'perfil' | 'cidade' | 'aceite';

/** Ordem em que os campos aparecem na tela: é a ordem do foco no primeiro erro. */
export const ORDEM_DOS_CAMPOS: readonly Campo[] = ['nome', 'whatsapp', 'perfil', 'cidade', 'aceite'];

export const PERFIS: readonly string[] = ['Adestramento', 'Passeio ou pet sitter', 'Creche ou hotel', 'Banho e tosa', 'Veterinária', 'Outro'];

export interface Dados { nome: string; whatsapp: string; perfil: string; cidade: string; aceite: boolean }
export type Erros = Partial<Record<Campo, string>>;

export const MENSAGENS: Record<Campo, string> = {
  nome: 'Diga como podemos chamar você.',
  whatsapp: 'Confira o número com DDD, por exemplo (11) 98765-4321.',
  perfil: 'Escolha a opção mais próxima do seu trabalho.',
  cidade: 'Informe sua cidade e estado.',
  aceite: 'Precisamos do seu aceite para entrar em contato.',
};

const REGRAS: Record<Campo, (d: Dados) => boolean> = {
  nome: (d) => d.nome.trim().length >= 2,
  whatsapp: (d) => whatsappValido(d.whatsapp),
  perfil: (d) => PERFIS.includes(d.perfil),
  cidade: (d) => d.cidade.trim().length >= 3,
  aceite: (d) => d.aceite === true,
};

export function validarCampo(campo: Campo, dados: Dados): string {
  return REGRAS[campo](dados) ? '' : MENSAGENS[campo];
}

export function validar(dados: Dados): Erros {
  const erros: Erros = {};
  for (const c of ORDEM_DOS_CAMPOS) {
    const m = validarCampo(c, dados);
    if (m) erros[c] = m;
  }
  return erros;
}

export function primeiroCampoComErro(erros: Erros): Campo | undefined {
  return ORDEM_DOS_CAMPOS.find((c) => erros[c]);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/validacao.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src/lib/validacao.ts tests/unit/validacao.test.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: regras de validacao do formulario de convite

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 4: Origem (UTM) e envio ao serviço

**Files:**
- Create: `src/lib/utm.ts`, `src/lib/formulario.ts`
- Test: `tests/unit/utm.test.ts`, `tests/unit/formulario.test.ts`

**Interfaces:**
- Consumes: `Dados` (Tarefa 3), `mascararWhatsapp` (Tarefa 2).
- Produces:
  - `CHAVES_DE_ORIGEM: readonly ['utm_source','utm_medium','utm_campaign','utm_content','ref']`; `type Origem = Partial<Record<…, string>>`; `lerOrigem(search: string): Origem`; `guardarOrigem(storage: Pick<Storage,'getItem'|'setItem'> | null, search: string): Origem`.
  - `TEXTO_DO_ACEITE: string`; `interface Config { chave: string; urlObrigado: string }`; `montarEnvio(dados: Dados, origem: Origem, config: Config): Record<string, string>`; `type Resultado = 'ok' | 'erro'`; `enviar(corpo: Record<string,string>, endpoint: string, fetchFn?: typeof fetch, tempoMs?: number): Promise<Resultado>`.

- [ ] **Step 1: Testes que falham**

`tests/unit/utm.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { guardarOrigem, lerOrigem } from '../../src/lib/utm';

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
}

describe('lerOrigem', () => {
  it('pega só as chaves conhecidas, sem espaços e com no máximo 100 caracteres', () => {
    const o = lerOrigem(`?utm_source=instagram&utm_medium= dm &x=1&ref=marcos&utm_content=${'a'.repeat(150)}`);
    expect(o).toEqual({ utm_source: 'instagram', utm_medium: 'dm', ref: 'marcos', utm_content: 'a'.repeat(100) });
  });
  it('sem parâmetros, vazio', () => { expect(lerOrigem('')).toEqual({}); });
});

describe('guardarOrigem', () => {
  it('guarda a origem da primeira página e a devolve depois, sem parâmetros na URL', () => {
    const s = memoria();
    expect(guardarOrigem(s, '?utm_source=grupo')).toEqual({ utm_source: 'grupo' });
    expect(guardarOrigem(s, '')).toEqual({ utm_source: 'grupo' });
  });
  it('uma origem nova substitui a guardada', () => {
    const s = memoria();
    guardarOrigem(s, '?utm_source=grupo');
    expect(guardarOrigem(s, '?ref=marcos')).toEqual({ ref: 'marcos' });
  });
  it('storage que lança (aba anônima) não quebra: devolve a origem da URL', () => {
    const quebrado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(guardarOrigem(quebrado, '?utm_source=x')).toEqual({ utm_source: 'x' });
    expect(guardarOrigem(null, '')).toEqual({});
  });
  it('valor guardado corrompido é ignorado', () => {
    const s = memoria();
    s.setItem('jp-origem', '{nao é json');
    expect(guardarOrigem(s, '')).toEqual({});
  });
});
```

`tests/unit/formulario.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/utm.test.ts tests/unit/formulario.test.ts` — Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar**

`src/lib/utm.ts`:

```ts
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
```

`src/lib/formulario.ts`:

```ts
import type { Dados } from './validacao';
import type { Origem } from './utm';
import { mascararWhatsapp } from './whatsapp';

export const TEXTO_DO_ACEITE = 'Aceito ser contatado(a) pela JornadaPet sobre o teste. Meus dados não serão compartilhados.';

export interface Config { chave: string; urlObrigado: string }

export function montarEnvio(dados: Dados, origem: Origem, config: Config): Record<string, string> {
  return {
    access_key: config.chave,
    subject: 'Novo pedido de convite: JornadaPet',
    from_name: 'Landing JornadaPet',
    nome: dados.nome.trim(),
    whatsapp: mascararWhatsapp(dados.whatsapp),
    perfil: dados.perfil,
    cidade: dados.cidade.trim(),
    aceite: 'sim',
    aceite_texto: TEXTO_DO_ACEITE,
    pagina: '/',
    ...origem,
  };
}

export type Resultado = 'ok' | 'erro';

export async function enviar(corpo: Record<string, string>, endpoint: string, fetchFn: typeof fetch = fetch, tempoMs = 15000): Promise<Resultado> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), tempoMs);
  try {
    const r = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    });
    if (!r.ok) return 'erro';
    const j: unknown = await r.json().catch(() => null);
    return typeof j === 'object' && j !== null && (j as { success?: unknown }).success === true ? 'ok' : 'erro';
  } catch {
    return 'erro';
  } finally {
    clearTimeout(t);
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` — Expected: PASS em todos os arquivos.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src/lib/utm.ts src/lib/formulario.ts tests/unit/utm.test.ts tests/unit/formulario.test.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: origem UTM e envio do formulario ao servico

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 5: Símbolo, navegação, menu do celular, rodapé e barra fixa

**Files:**
- Create: `src/scripts/tipos.ts`, `src/scripts/pagina.ts`, `src/data/conteudo.ts`, `src/components/Simbolo.astro`, `src/components/Nav.astro`, `src/components/Rodape.astro`, `src/components/BarraCelular.astro`, `tests/e2e/navegacao.spec.ts`
- Modify: `src/scripts/alpine.ts`, `src/pages/index.astro`

**Interfaces:**
- Produces: `type Magia` (`$nextTick`, `$refs`, `$dispatch`, `$el`); `Alpine.data('pagina')` com `menu: boolean`, `scrolled: boolean`, `heroCta: boolean`, `formVisivel: boolean`, `abrirMenu()`, `fecharMenu(devolverFoco?: boolean)`; `LINKS_DA_NAV: { rotulo: string; href: string }[]`; `CONTATO_EMAIL = 'contato@jornadapet.com.br'`; componente `<Simbolo tamanho="sm" | "md" | "lg" forma="quadrado" | "circulo" />`. O `<body>` passa a ter `x-data="pagina"`; outras seções leem `heroCta` e `formVisivel` dele.

- [ ] **Step 1: Teste e2e que falha**

`tests/e2e/navegacao.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'só no celular');

  test('menu abre, prende o foco, fecha com Esc e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/');
    const botao = page.getByRole('button', { name: 'Abrir menu' });
    await botao.click();
    const menu = page.locator('#menu-mobile');
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(await menu.evaluate((m) => m.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
  });

  test('link do menu fecha o menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.locator('#menu-mobile').getByRole('link', { name: 'Sobre' }).click();
    await expect(page.locator('#menu-mobile')).toBeHidden();
  });
});

test('rodapé tem endosso da ArrayOf, e-mail visível e link para a política', async ({ page }) => {
  await page.goto('/');
  const rodape = page.locator('footer');
  await expect(rodape.getByText('JornadaPet é um produto da')).toBeVisible();
  await expect(rodape.getByRole('link', { name: 'ArrayOf' })).toHaveAttribute('href', 'https://arrayof.com.br');
  await expect(rodape.getByText('contato@jornadapet.com.br')).toBeVisible();
  await expect(rodape.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute('href', '/privacidade');
});

test('o símbolo é SVG próprio, sem fonte de ícones', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header svg[data-simbolo]')).toHaveCount(1);
  expect(await page.locator('link[href*="phosphor"], .ph').count()).toBe(0);
});
```

Run: `npm run test:e2e -- tests/e2e/navegacao.spec.ts` — Expected: FAIL (não há menu nem rodapé).

- [ ] **Step 2: Implementar**

`src/scripts/tipos.ts`:

```ts
/** Propriedades mágicas do Alpine usadas pelos componentes (o Alpine as injeta no `this`). */
export interface Magia {
  $el: HTMLElement;
  $refs: Record<string, HTMLElement | undefined>;
  $nextTick: (cb: () => void) => void;
  $dispatch: (evento: string, detalhe?: unknown) => void;
}
```

`src/scripts/pagina.ts`:

```ts
import type { Magia } from './tipos';

export interface Pagina {
  menu: boolean; scrolled: boolean; heroCta: boolean; formVisivel: boolean;
  init(): void; abrirMenu(): void; fecharMenu(devolverFoco?: boolean): void;
}

export function pagina(): Pagina & ThisType<Pagina & Magia> {
  return {
    menu: false, scrolled: false, heroCta: true, formVisivel: false,
    init() {
      const marca = document.createElement('div');
      marca.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px';
      document.body.prepend(marca);
      new IntersectionObserver(([e]) => { this.scrolled = !e.isIntersecting; }, { rootMargin: '-64px 0px 0px 0px' }).observe(marca);
    },
    abrirMenu() { this.menu = true; },
    fecharMenu(devolverFoco = false) {
      this.menu = false;
      if (devolverFoco) this.$nextTick(() => this.$refs.botaoMenu?.focus());
    },
  };
}
```

`src/scripts/alpine.ts` — acrescente o registro:

```ts
import type { Alpine } from 'alpinejs';
import intersect from '@alpinejs/intersect';
import focus from '@alpinejs/focus';
import { pagina } from './pagina';

export default (Alpine: Alpine) => {
  Alpine.plugin(intersect);
  Alpine.plugin(focus);
  Alpine.data('pagina', pagina);
};
```

`src/data/conteudo.ts`:

```ts
export const CONTATO_EMAIL = 'contato@jornadapet.com.br';

export const LINKS_DA_NAV = [
  { rotulo: 'Como funciona', href: '#como-funciona' },
  { rotulo: 'Para quem', href: '#para-quem' },
  { rotulo: 'Sobre', href: '#sobre' },
  { rotulo: 'Perguntas', href: '#perguntas' },
] as const;
```

`src/components/Simbolo.astro`:

```astro
---
/** Símbolo "J-guia" (DESIGN.md, Shapes): J de traço único com argola de mosquetão. Cores fixas nos dois temas. */
interface Props { tamanho?: 'sm' | 'md' | 'lg'; forma?: 'quadrado' | 'circulo' }
const { tamanho = 'md', forma = 'quadrado' } = Astro.props;
const caixa = { sm: 'size-6', md: 'size-8', lg: 'size-10' }[tamanho];
const traco = { sm: 'size-3.5', md: 'size-5', lg: 'size-6' }[tamanho];
---
<span class:list={['grid shrink-0 place-items-center bg-[#e1e7d6] text-[#3f5a2c]', caixa, forma === 'circulo' ? 'rounded-full' : 'r-ctl']}>
  <svg data-simbolo class={traco} viewBox="-1.75 -1 26 32" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true">
    <path d="M20 4.5V18.5a7.25 7.25 0 0 1-14.5 0" /><circle cx="5.5" cy="13.75" r="3" />
  </svg>
</span>
```

`src/components/Nav.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import Simbolo from './Simbolo.astro';
import { LINKS_DA_NAV } from '../data/conteudo';
---
<header class="sticky top-0 z-40 border-b transition-colors duration-300" :class="scrolled ? 'border-line bg-bg/80 backdrop-blur-md' : 'border-transparent bg-transparent'">
  <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Principal">
    <a href="#topo" class="flex items-center gap-2 text-ink" aria-label="JornadaPet, início">
      <Simbolo />
      <span class="display text-[18px] font-bold" translate="no">JornadaPet</span>
    </a>
    <ul class="hidden items-center gap-7 text-[14px] font-medium text-body md:flex">
      {LINKS_DA_NAV.map((l) => <li><a class="hover:text-ink" href={l.href}>{l.rotulo}</a></li>)}
    </ul>
    <div class="flex items-center gap-2">
      <a href="#participe" class="cta r-ctl hidden items-center gap-2 px-4 py-2.5 text-[14px] font-semibold sm:inline-flex">Quero testar</a>
      <button type="button" x-ref="botaoMenu" class="grid size-11 place-items-center r-ctl text-ink md:hidden"
        @click="menu ? fecharMenu() : abrirMenu()" :aria-expanded="menu.toString()" aria-controls="menu-mobile" aria-label="Abrir menu" :aria-label="menu ? 'Fechar menu' : 'Abrir menu'">
        <Icon name="ph:list" class="size-6" x-show="!menu" aria-hidden="true" />
        <Icon name="ph:x" class="size-6" x-show="menu" x-cloak aria-hidden="true" />
      </button>
    </div>
  </nav>
  <div id="menu-mobile" x-cloak x-show="menu" x-transition.opacity x-trap.noscroll="menu" @keydown.escape="fecharMenu(true)"
    class="fixed inset-x-0 top-16 bottom-0 z-40 overscroll-contain bg-bg px-4 pt-4 md:hidden">
    <ul class="display flex flex-col text-[20px] font-medium text-ink">
      {LINKS_DA_NAV.map((l) => <li><a class="block border-b border-line py-4" href={l.href} @click="fecharMenu()">{l.rotulo}</a></li>)}
    </ul>
    <a href="#participe" @click="fecharMenu()" class="cta r-ctl mt-6 flex items-center justify-center gap-2 px-5 py-3.5 font-semibold">Quero testar</a>
  </div>
</header>
```

> Nota: o `aria-label` estático ("Abrir menu") é o valor sem JS; o `:aria-label` do Alpine o sobrescreve. O botão tem 44px (`size-11`).

`src/components/Rodape.astro`:

```astro
---
import Simbolo from './Simbolo.astro';
import { CONTATO_EMAIL } from '../data/conteudo';
---
<footer class="border-t border-line bg-surface">
  <div class="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
    <div class="max-w-[32ch]">
      <div class="flex items-center gap-2 text-ink"><Simbolo /><span class="display text-[18px] font-bold" translate="no">JornadaPet</span></div>
      <p class="mt-3 text-[14px] leading-relaxed">Clientes, agenda e valores a receber para profissionais do cuidado animal.</p>
    </div>
    <div class="grid gap-x-12 gap-y-2 text-[14px] sm:grid-cols-2">
      <a class="hover:text-ink" href="/#como-funciona">Como funciona</a>
      <span class="select-all text-ink">{CONTATO_EMAIL}</span>
      <a class="hover:text-ink" href="/#para-quem">Para quem</a>
      <a class="hover:text-ink" href="/privacidade">Política de privacidade</a>
      <a class="hover:text-ink" href="/#sobre">Sobre</a>
      <a class="hover:text-ink" href="/#perguntas">Perguntas</a>
    </div>
  </div>
  <div class="mx-auto flex max-w-6xl flex-col gap-1 border-t border-line px-4 py-5 text-[14px] text-mute sm:flex-row sm:justify-between sm:px-6">
    <span>JornadaPet é um produto da <a href="https://arrayof.com.br" target="_blank" rel="noopener" class="text-ink underline decoration-line decoration-2 hover:decoration-accent">ArrayOf</a>.</span>
    <span>© 2026 ArrayOf</span>
  </div>
</footer>
```

`src/components/BarraCelular.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
---
<div x-cloak x-show="!heroCta && !formVisivel && !menu" x-transition.opacity
  class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md md:hidden">
  <a href="#participe" class="cta r-ctl flex items-center justify-center gap-2 py-3.5 text-[16px] font-semibold">Quero testar <Icon name="ph:arrow-right" class="seta size-4" aria-hidden="true" /></a>
</div>
```

`src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Rodape from '../components/Rodape.astro';
import BarraCelular from '../components/BarraCelular.astro';
---
<Base title="JornadaPet: agenda e clientes para adestradores de cães" description="Organize tutores, pets, sessões e valores a receber do seu trabalho de adestramento no Telegram, sem instalar outro app. Acesso por convite.">
  <div x-data="pagina" :class="{ 'overflow-hidden': menu }">
    <BarraCelular />
    <Nav />
    <main id="conteudo">
      <h1 class="text-[clamp(2.3rem,4.4vw,3.6rem)] font-bold leading-[1.04]">Adestrador: saiba quem já pagou e quem ainda falta.</h1>
    </main>
    <Rodape />
  </div>
</Base>
```

> O estado da página fica num `<div x-data="pagina">` que envolve tudo (em vez do `<body>` do protótipo), porque o `<body>` está no layout.

- [ ] **Step 3: Rodar e ver passar**

Run: `npm run test:e2e -- tests/e2e/navegacao.spec.ts tests/e2e/base.spec.ts` — Expected: PASS (os testes de celular rodam só no projeto `celular`).

- [ ] **Step 4: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src tests/e2e/navegacao.spec.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: simbolo J-guia, navegacao, menu do celular, rodape e barra fixa

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 6: Hero

**Files:**
- Create: `src/components/Hero.astro`, `src/assets/thor-hero.jpg`, `tests/e2e/hero.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Simbolo` (T5); estado `heroCta` da `pagina` (T5).

- [ ] **Step 1: Copiar a foto**

```bash
mkdir -p src/assets
cp docs/notas-tecnicas/prototipos/NT-001-assets/thor-hero.jpg src/assets/thor-hero.jpg
```

- [ ] **Step 2: Teste que falha**

`tests/e2e/hero.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('hero com o texto da spec, CTA e linha de apoio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Adestrador: saiba quem já pagou e quem ainda falta.');
  await expect(page.locator('#topo').getByRole('link', { name: 'Quero testar' })).toHaveAttribute('href', '#participe');
  await expect(page.getByText('Acesso por convite. A gente chama você no WhatsApp.')).toBeVisible();
  await expect(page.getByRole('img', { name: /conversa com o bot da JornadaPet/ })).toBeVisible();
});

test('foto do hero carrega com prioridade e sem lazy', async ({ page }) => {
  await page.goto('/');
  const img = page.locator('#topo .hero-photo img');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  await expect(img).not.toHaveAttribute('loading', 'lazy');
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('título e foto nunca começam invisíveis', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['#topo h1', '#topo .hero-photo']) {
    expect(await page.locator(sel).evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  }
});

test('título em no máximo 3 linhas no desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'regra de desktop');
  await page.goto('/');
  const linhas = await page.locator('#topo h1').evaluate((h) => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
  expect(linhas).toBeLessThanOrEqual(3);
});
```

Run: `npm run test:e2e -- tests/e2e/hero.spec.ts` — Expected: FAIL.

- [ ] **Step 3: Implementar `src/components/Hero.astro`**

```astro
---
import { Picture } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import Simbolo from './Simbolo.astro';
import thorHero from '../assets/thor-hero.jpg';
---
<section id="topo" class="relative overflow-hidden">
  <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 md:pt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-12 lg:pb-24">
    <div class="hero-in flex flex-col items-start gap-5">
      <span class="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[14px] font-medium text-ink">
        <Icon name="ph:hammer" class="size-4" aria-hidden="true" /> Em construção, ouvindo adestradores
      </span>
      <h1 class="text-[clamp(2.3rem,4.4vw,3.6rem)] font-bold leading-[1.04]">Adestrador: saiba quem já pagou e quem ainda falta.</h1>
      <p class="max-w-[46ch] text-[18px] leading-relaxed">Clientes, sessões e valores a receber organizados no Telegram. Sem caderno, sem planilha, sem instalar outro app.</p>
      <div class="flex flex-wrap items-center gap-4 pt-1" x-intersect:enter="heroCta = true" x-intersect:leave="heroCta = false">
        <a href="#participe" class="cta r-ctl inline-flex items-center gap-2 px-5 py-3.5 text-[16px] font-semibold">Quero testar <Icon name="ph:arrow-right" class="seta size-4" aria-hidden="true" /></a>
        <a href="#como-funciona" class="text-[16px] font-medium text-ink underline decoration-line decoration-2 hover:decoration-accent">Ver como funciona</a>
      </div>
      <p class="flex items-center gap-2 text-[14px] text-mute"><Icon name="ph:envelope-simple-open" class="size-4 text-accent" aria-hidden="true" /> Acesso por convite. A gente chama você no WhatsApp.</p>
    </div>

    <div class="relative mx-auto w-full max-w-[520px]">
      <div class="blob b1 -top-10 right-6 size-72"></div>
      <div class="blob b2 top-40 -right-10 size-64"></div>
      <div class="blob b3 -bottom-6 left-0 size-60"></div>
      <figure class="hero-photo relative ml-auto w-[78%] overflow-hidden r-card" style="aspect-ratio: 5/6">
        <Picture src={thorHero} formats={['avif', 'webp']} widths={[320, 480, 640, 800]} sizes="(min-width: 1024px) 410px, 78vw"
          alt="Border collie correndo atrás de uma bolinha de tênis durante o treino" class="size-full object-cover" loading="eager" fetchpriority="high" />
      </figure>
      <div class="note n1 glass r-card absolute bottom-[3%] left-0 w-[78%] max-w-[300px] p-3 text-[14px] leading-snug text-ink" style="--r:-1.5deg"
        role="img" aria-label="Exemplo: conversa com o bot da JornadaPet no Telegram, com o botão Abrir JornadaPet">
        <div class="flex items-center gap-2 border-b border-line/60 pb-2">
          <Simbolo tamanho="sm" forma="circulo" />
          <div class="leading-tight"><div class="font-semibold">JornadaPet</div><div class="text-[12px] text-mute">bot</div></div>
          <Icon name="ph:telegram-logo" class="ml-auto size-[18px] text-mute" aria-hidden="true" />
        </div>
        <div class="mt-2.5 flex flex-col gap-2">
          <span class="self-end rounded-[14px] rounded-br-[4px] bg-accent px-3 py-1.5 font-medium text-accent-ink">/start</span>
          <span class="max-w-[90%] self-start rounded-[14px] rounded-bl-[4px] bg-surface/90 px-3 py-2">Oi, Camila! Sua agenda, seus clientes e o que falta receber estão aqui.</span>
          <span class="flex items-center justify-center gap-2 r-ctl bg-surface/90 py-2 font-semibold text-accent"><Icon name="ph:app-window" class="size-4" aria-hidden="true" /> Abrir JornadaPet</span>
        </div>
      </div>
      <div class="note n2 glass r-card absolute right-[-2%] top-[8%] w-[56%] max-w-[220px] p-3.5 text-[14px] leading-snug text-ink" style="--r:2deg"
        role="img" aria-label="Exemplo: Marina pagou 100 reais e faltam 200">
        <div class="flex items-center gap-2 font-semibold"><Icon name="ph:check-circle-fill" class="size-4 text-accent" aria-hidden="true" /> Marina pagou R$ 100</div>
        <div class="mt-1 text-[14px] text-mute">Faltam R$ 200 do pacote</div>
      </div>
    </div>
  </div>
</section>
```

Em `src/pages/index.astro`, troque o `<h1>` provisório dentro de `<main>` por `<Hero />` (e importe `import Hero from '../components/Hero.astro';`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:e2e -- tests/e2e/hero.spec.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src tests/e2e/hero.spec.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: hero com conversa do bot e foto otimizada

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 7: Como funciona — passo a passo

**Files:**
- Create: `src/scripts/stepper.ts`, `src/components/ComoFunciona.astro`, `src/assets/thor-avatar.jpg`, `tests/e2e/como-funciona.spec.ts`
- Modify: `src/data/conteudo.ts`, `src/scripts/alpine.ts`, `src/pages/index.astro`

**Interfaces:**
- Produces: `PASSOS: { id: 'cadastre'|'agende'|'acompanhe'; titulo: string; icone: string; tom: string; texto: string }[]`; `Alpine.data('stepper')` com `cur`, `auto`, `hold`, `visivel`, `dur`, `reduzido`, `init()`, `iniciar()`, `parar()`, `ir(i, foco?)`, `proximo()`.

- [ ] **Step 1: Copiar a foto e acrescentar os passos aos dados**

```bash
cp docs/notas-tecnicas/prototipos/NT-001-assets/thor-avatar.jpg src/assets/thor-avatar.jpg
```

Acrescente a `src/data/conteudo.ts`:

```ts
export const PASSOS = [
  { id: 'cadastre', titulo: 'Cadastre', icone: 'ph:address-book', tom: 'bg-mint', texto: 'Tutores e pets com WhatsApp, endereço preenchido pelo CEP e as observações de cada cão.' },
  { id: 'agende', titulo: 'Agende', icone: 'ph:calendar-check', tom: 'bg-sky', texto: 'Sessões por dia ou semana, repetição toda semana e aviso quando dois horários se cruzam.' },
  { id: 'acompanhe', titulo: 'Acompanhe', icone: 'ph:wallet', tom: 'bg-butter', texto: 'Registre o valor combinado e cada pagamento, inteiro ou em partes. O saldo se atualiza sozinho.' },
] as const;
```

- [ ] **Step 2: Teste que falha**

`tests/e2e/como-funciona.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('passos aparecem sem JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  const sec = page.locator('#como-funciona');
  for (const t of ['Tutores e pets com WhatsApp', 'Terça, 14 de outubro', 'Pacote de outubro, Thor']) {
    await expect(sec.getByText(t, { exact: false }).first()).toBeVisible();
  }
  await ctx.close();
});

test('setas trocam a aba, movem o foco e só um painel fica ativo', async ({ page }) => {
  await page.goto('/#como-funciona');
  const abas = page.getByRole('tab');
  await expect(abas).toHaveCount(3);
  await abas.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Agende' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Agende' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#painel-agende')).toHaveAttribute('data-on', 'true');
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('inert', '');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Acompanhe' })).toBeFocused();
});

test('no desktop troca sozinho e o botão pausa', async ({ page, isMobile }) => {
  test.skip(isMobile, 'troca automática só no desktop');
  await page.clock.install();
  await page.goto('/');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('data-on', 'true');
  await page.clock.runFor(6500);
  await expect(page.locator('#painel-agende')).toHaveAttribute('data-on', 'true');
  await page.getByRole('button', { name: 'Pausar a demonstração' }).click();
  await page.clock.runFor(13000);
  await expect(page.locator('#painel-agende')).toHaveAttribute('data-on', 'true');
});

test('no celular não troca sozinho', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'regra de celular');
  await page.clock.install();
  await page.goto('/');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.clock.runFor(13000);
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('data-on', 'true');
});

test('com reduzir movimento não troca sozinho', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.clock.runFor(13000);
  await expect(page.locator('#painel-cadastre')).toHaveAttribute('data-on', 'true');
});
```

> A troca é feita por um relógio (`setInterval` de `dur` no `init` do componente); a barra é só indicador visual. O `proximo()` não troca se `auto` for falso, a seção estiver fora da tela ou houver ponteiro/foco dentro.

Run: `npm run test:e2e -- tests/e2e/como-funciona.spec.ts` — Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/scripts/stepper.ts`:

```ts
import type { Magia } from './tipos';

export interface Stepper {
  cur: number; auto: boolean; hold: boolean; visivel: boolean; dur: number;
  readonly reduzido: boolean;
  init(): void; iniciar(): void; parar(): void; ir(i: number, foco?: boolean): void; proximo(): void;
}

const IDS = ['cadastre', 'agende', 'acompanhe'] as const;

export function stepper(): Stepper & ThisType<Stepper & Magia> {
  return {
    cur: 0, auto: false, hold: false, visivel: false, dur: 6000,
    get reduzido() { return document.documentElement.classList.contains('rm'); },
    init() { window.setInterval(() => this.proximo(), this.dur); },
    iniciar() { this.auto = !this.reduzido && window.matchMedia('(min-width: 1024px)').matches; },
    parar() { this.auto = false; },
    ir(i, foco = false) {
      this.cur = i;
      this.auto = false;
      if (foco) this.$nextTick(() => document.getElementById('tab-' + IDS[i])?.focus());
    },
    proximo() {
      if (this.auto && this.visivel && !this.hold) this.cur = (this.cur + 1) % IDS.length;
    },
  };
}
```

Em `src/scripts/alpine.ts`, acrescente `import { stepper } from './stepper';` e `Alpine.data('stepper', stepper);`.

`src/components/ComoFunciona.astro`:

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import { PASSOS } from '../data/conteudo';
import thorAvatar from '../assets/thor-avatar.jpg';
---
<section id="como-funciona" class="scroll-mt-20 bg-surface py-20 sm:py-24"
  x-data="stepper" x-intersect:enter="visivel = true; iniciar()" x-intersect:leave="visivel = false; parar()"
  @mouseenter="hold = true" @mouseleave="hold = false" @focusin="hold = true" @focusout="hold = false" :class="{ paused: hold }">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <h2 class="max-w-[18ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Cliente, sessão e pagamento, num lugar só.</h2>
    <p class="mt-4 max-w-[52ch] text-[18px] leading-relaxed">Sem planilha, sem caderno e sem procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar.</p>

    <div class="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      <div role="tablist" aria-label="Passos" class="grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-3">
        {PASSOS.map((p, i) => (
          <button type="button" role="tab" id={`tab-${p.id}`} aria-controls={`painel-${p.id}`} aria-selected={i === 0 ? 'true' : 'false'} tabindex={i === 0 ? 0 : -1}
            :aria-selected={`(cur === ${i}).toString()`} :tabindex={`cur === ${i} ? 0 : -1`}
            @click={`ir(${i})`} @keydown.arrow-right.prevent={`ir(${(i + 1) % 3}, true)`} @keydown.arrow-down.prevent={`ir(${(i + 1) % 3}, true)`}
            @keydown.arrow-left.prevent={`ir(${(i + 2) % 3}, true)`} @keydown.arrow-up.prevent={`ir(${(i + 2) % 3}, true)`}
            class="group relative overflow-hidden r-card border p-3 text-left transition-colors duration-300 lg:p-5"
            :class={`cur === ${i} ? 'border-transparent bg-bg' : 'border-line hover:bg-bg/60'`}>
            <div class="flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-3">
              <span class="grid size-10 shrink-0 place-items-center r-ctl transition-colors duration-300" :class={`cur === ${i} ? '${p.tom} text-ink' : 'bg-bg text-mute'`}>
                <Icon name={p.icone} class="size-5" aria-hidden="true" />
              </span>
              <span class="display text-[14px] font-semibold text-ink sm:text-[16px] lg:text-[20px]">{p.titulo}</span>
            </div>
            <p class="mt-2 hidden max-w-[40ch] text-[16px] leading-relaxed lg:block">{p.texto}</p>
            <span class="absolute inset-x-0 bottom-0 h-[3px] bg-line/60" aria-hidden="true">
              <span class="step-progress block h-full bg-accent" :class={`{ run: cur === ${i} && auto }`} :style="'--dur:' + dur + 'ms'"></span>
            </span>
          </button>
        ))}
      </div>

      <div class="palco relative min-h-[560px] overflow-hidden r-card bg-bg p-5 sm:min-h-[460px] sm:p-8">
        <div class="blob b1 -top-16 -left-10 size-72"></div>
        <div class="blob b2 -bottom-20 right-0 size-80"></div>
        <button type="button" x-cloak x-show="!reduzido" class="absolute right-3 top-3 z-10 hidden size-9 place-items-center rounded-full border border-line bg-surface/80 text-ink hover:bg-surface lg:grid"
          @click="auto ? parar() : (auto = true)" :aria-label="auto ? 'Pausar a demonstração' : 'Retomar a demonstração'" aria-label="Pausar a demonstração">
          <Icon name="ph:pause" class="size-4" x-show="auto" aria-hidden="true" />
          <Icon name="ph:play" class="size-4" x-show="!auto" x-cloak aria-hidden="true" />
        </button>
        {PASSOS.map((p, i) => <p class="relative pr-10 text-[16px] leading-relaxed text-body lg:hidden" x-show={`cur === ${i}`} x-cloak={i !== 0}>{p.texto}</p>)}

        <div id="painel-cadastre" role="tabpanel" tabindex="0" aria-labelledby="tab-cadastre" class="stage-card absolute inset-x-4 top-32 sm:inset-x-10 sm:top-10 lg:top-12" data-on="true" :data-on="(cur === 0).toString()" :inert="cur !== 0">
          <div class="glass r-card mx-auto max-w-[390px] p-5 text-[14px]">
            <div class="flex items-center gap-3">
              <Image src={thorAvatar} width={56} height={56} alt="" class="size-14 rounded-full object-cover" />
              <div><div class="display text-[20px] font-semibold text-ink">Thor</div><div class="text-[12px] text-mute">Border collie, macho, 2 anos</div></div>
              <span class="ml-auto rounded-full bg-mint px-2.5 py-0.5 text-[12px] font-medium text-ink">Ativo</span>
            </div>
            <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
              <dt class="text-mute">Tutora</dt><dd class="font-medium text-ink">Marina Alves</dd>
              <dt class="text-mute">WhatsApp</dt><dd class="text-ink">(19) 99812-4470</dd>
              <dt class="text-mute">Endereço</dt><dd class="text-ink">R. das Palmeiras, 212, Taquaral, Campinas</dd>
              <dt class="text-mute">Observações</dt><dd class="text-ink">Reativo a bicicletas. Gosta de petisco de frango.</dd>
            </dl>
            <div class="mt-4 flex items-center gap-1.5 text-[12px] text-mute"><Icon name="ph:map-pin" class="size-4" aria-hidden="true" /> Endereço preenchido pelo CEP 13087-120</div>
          </div>
        </div>

        <div id="painel-agende" role="tabpanel" tabindex="0" aria-labelledby="tab-agende" class="stage-card absolute inset-x-4 top-32 sm:inset-x-10 sm:top-10 lg:top-12" data-on="false" :data-on="(cur === 1).toString()" :inert="cur !== 1">
          <div class="glass r-card mx-auto max-w-[400px] p-5 text-[14px]">
            <div class="flex items-center justify-between"><div class="display text-[20px] font-semibold text-ink">Terça, 14 de outubro</div><span class="r-ctl border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-ink">Semana</span></div>
            <ol class="mt-4 space-y-2">
              <li class="flex items-center gap-3 r-ctl bg-surface p-3"><span class="w-12 font-semibold text-ink">08:00</span><div class="min-w-0 flex-1"><div class="font-medium text-ink">Mel</div><div class="text-[12px] text-mute">Ricardo Nunes</div></div><span class="flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[12px] font-medium text-accent"><Icon name="ph:check-circle-fill" class="size-3.5" aria-hidden="true" /> Concluído</span></li>
              <li class="flex items-center gap-3 r-ctl bg-surface p-3"><span class="w-12 font-semibold text-ink">10:30</span><div class="min-w-0 flex-1"><div class="font-medium text-ink">Pipoca</div><div class="text-[12px] text-mute">Juliana Prado</div></div><span class="rounded-full bg-peach px-2.5 py-0.5 text-[12px] font-medium text-ink">Falta</span></li>
              <li class="flex items-center gap-3 r-ctl bg-surface p-3 ring-2 ring-accent/40"><span class="w-12 font-semibold text-ink">16:00</span><div class="min-w-0 flex-1"><div class="font-medium text-ink">Thor</div><div class="flex items-center gap-1 text-[12px] text-mute"><Icon name="ph:repeat" class="size-3.5" aria-hidden="true" /> Toda terça</div></div><span class="rounded-full bg-sky px-2.5 py-0.5 text-[12px] font-medium text-ink">Agendado</span></li>
            </ol>
            <div class="mt-3 flex gap-2 r-ctl bg-butter p-3 text-[12px] text-ink"><Icon name="ph:warning" class="size-4 shrink-0" aria-hidden="true" /><span>Este horário se sobrepõe a outra sessão. Salvar mesmo assim?</span></div>
          </div>
        </div>

        <div id="painel-acompanhe" role="tabpanel" tabindex="0" aria-labelledby="tab-acompanhe" class="stage-card absolute inset-x-4 top-32 sm:inset-x-10 sm:top-10 lg:top-12" data-on="false" :data-on="(cur === 2).toString()" :inert="cur !== 2">
          <div class="glass r-card mx-auto max-w-[390px] p-5 text-[14px]">
            <div class="text-[12px] font-medium text-mute">Valor a receber de Marina Alves</div>
            <div class="display mt-1 text-[20px] font-semibold text-ink">Pacote de outubro, Thor</div>
            <div class="mt-1 text-[12px] text-mute">R$ 300,00 com vencimento em 10/10</div>
            <ul class="mt-4 space-y-2">
              <li class="flex items-center justify-between r-ctl bg-surface p-3"><span class="flex items-center gap-2 text-ink"><Icon name="ph:arrow-down-left" class="size-4 text-accent" aria-hidden="true" /> Pagamento em 02/10</span><span class="font-semibold tabular-nums text-ink">R$ 100,00</span></li>
              <li class="flex items-center justify-between r-ctl bg-surface p-3"><span class="flex items-center gap-2 text-ink"><Icon name="ph:arrow-down-left" class="size-4 text-accent" aria-hidden="true" /> Pagamento em 09/10</span><span class="font-semibold tabular-nums text-ink">R$ 200,00</span></li>
            </ul>
            <div class="mt-4 flex items-center justify-between border-t border-line pt-3"><span class="text-mute">Saldo a receber</span><span class="flex items-center gap-2 text-[18px] font-bold tabular-nums text-ink"><Icon name="ph:check-circle-fill" class="size-4 text-accent" aria-hidden="true" /> R$ 0,00</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-10 flex flex-wrap items-center gap-4">
      <a href="#participe" class="cta r-ctl inline-flex items-center gap-2 px-5 py-3.5 text-[16px] font-semibold">Quero testar <Icon name="ph:arrow-right" class="seta size-4" aria-hidden="true" /></a>
      <span class="text-[16px] text-mute">Leva um minuto para pedir o convite.</span>
    </div>
  </div>
</section>
```

> Sem JS, o CSS da Tarefa 1 (`html.no-js .stage-card`) empilha os três painéis, todos navegáveis. O `inert` só existe com JS, pelo `:inert` do Alpine.

Em `src/pages/index.astro`, coloque `<ComoFunciona />` depois de `<Hero />` (com o import).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:e2e -- tests/e2e/como-funciona.spec.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src tests/e2e/como-funciona.spec.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: passo a passo cadastre, agende, acompanhe

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 8: Prévia, Para quem, O que estamos estudando e Sobre

**Files:**
- Create: `src/components/Previa.astro`, `src/components/ParaQuem.astro`, `src/components/EmEstudo.astro`, `src/components/Sobre.astro`, `src/assets/{adestrador,passeador,creche,banho-tosa,veterinario,socio-mario,socio-thiago}.jpg`, `tests/e2e/secoes.spec.ts`
- Modify: `src/data/conteudo.ts`, `src/pages/index.astro`

**Interfaces:**
- Consumes: `Simbolo` (T5); `PERFIS` (T3) para o valor do evento.
- Produces: `PERFIS_DA_PAGINA: { imagem: ImageMetadata; titulo: string; perfil: string }[]`; `SOCIOS: { nome: string; linkedin: string; foto: ImageMetadata }[]`; cada cartão de perfil é `<a href="#participe" data-perfil="…">` que dispara o evento `perfil` (detalhe = valor do perfil) — o formulário (T9) escuta `@perfil.window`.

- [ ] **Step 1: Copiar as fotos**

```bash
for f in adestrador passeador creche banho-tosa veterinario socio-mario socio-thiago; do cp docs/notas-tecnicas/prototipos/NT-001-assets/$f.jpg src/assets/$f.jpg; done
```

- [ ] **Step 2: Dados** — acrescente a `src/data/conteudo.ts`:

```ts
import passeador from '../assets/passeador.jpg';
import creche from '../assets/creche.jpg';
import banhoTosa from '../assets/banho-tosa.jpg';
import veterinario from '../assets/veterinario.jpg';
import socioMario from '../assets/socio-mario.jpg';
import socioThiago from '../assets/socio-thiago.jpg';

/** `perfil` precisa ser um dos PERFIS de src/lib/validacao.ts: é o chip que o cartão marca no formulário. */
export const PERFIS_DA_PAGINA = [
  { imagem: passeador, titulo: 'Passeadores e pet sitters', perfil: 'Passeio ou pet sitter' },
  { imagem: creche, titulo: 'Creches e hotéis', perfil: 'Creche ou hotel' },
  { imagem: banhoTosa, titulo: 'Banho e tosa', perfil: 'Banho e tosa' },
  { imagem: veterinario, titulo: 'Veterinários', perfil: 'Veterinária' },
] as const;

export const SOCIOS = [
  { nome: 'Mario Guedes', linkedin: 'https://www.linkedin.com/in/jmarioguedes/', foto: socioMario },
  { nome: 'Thiago Filadelfo', linkedin: 'https://www.linkedin.com/in/trfiladelfo/', foto: socioThiago },
] as const;
```

E um teste unitário que amarra os perfis da página aos do formulário — `tests/unit/conteudo.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/assets/passeador.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/creche.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/banho-tosa.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/veterinario.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/socio-mario.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/socio-thiago.jpg', () => ({ default: {} }));

import { PASSOS, PERFIS_DA_PAGINA } from '../../src/data/conteudo';
import { PERFIS } from '../../src/lib/validacao';

describe('conteúdo', () => {
  it('todo cartão de perfil marca um perfil que o formulário aceita', () => {
    for (const p of PERFIS_DA_PAGINA) expect(PERFIS).toContain(p.perfil);
  });
  it('nenhum texto tem travessão', () => {
    const textos = [...PASSOS.map((p) => p.texto), ...PERFIS_DA_PAGINA.map((p) => p.titulo)];
    for (const t of textos) expect(t).not.toMatch(/[—–]/);
  });
});
```

- [ ] **Step 3: Teste e2e que falha**

`tests/e2e/secoes.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('seções com conteúdo visível sem JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const t of ['O seu dia, aberto no Telegram.', 'Feito primeiro para adestradores.', 'Passeadores e pet sitters', 'O que estamos estudando.', 'Uma empresa pequena, que prefere ouvir antes de vender.', 'Mario Guedes', 'Thiago Filadelfo']) {
    await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
  }
  await ctx.close();
});

test('nada da revelação fica invisível', async ({ page }) => {
  await page.goto('/');
  const opacidades = await page.locator('[data-reveal]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
  expect(opacidades.length).toBeGreaterThan(0);
  for (const o of opacidades) expect(o).toBe('1');
});

test('sócios levam ao LinkedIn em nova aba', async ({ page }) => {
  await page.goto('/');
  const mario = page.locator('#sobre').getByRole('link', { name: /Mario Guedes/ });
  await expect(mario).toHaveAttribute('href', 'https://www.linkedin.com/in/jmarioguedes/');
  await expect(mario).toHaveAttribute('target', '_blank');
  await expect(mario).toHaveAttribute('rel', /noopener/);
});

test('sem títulos de nível 3 dentro dos exemplos de interface', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('#como-funciona h3, .previa h3').count()).toBe(0);
});
```

Run: `npm test && npm run test:e2e -- tests/e2e/secoes.spec.ts` — Expected: Vitest falha (export inexistente) e e2e FAIL.

- [ ] **Step 4: Implementar os componentes**

`src/components/Previa.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import Simbolo from './Simbolo.astro';
const esquerda = [
  { icone: 'ph:telegram-logo', titulo: 'Dentro do Telegram', texto: 'Abre pelo nosso bot. Não tem outro aplicativo para baixar.' },
  { icone: 'ph:devices', titulo: 'No celular e no computador', texto: 'Use os dois ao mesmo tempo, com os mesmos dados.' },
];
const direita = [
  { icone: 'ph:warning-diamond', titulo: 'Aviso de horário cruzado', texto: 'Se duas sessões se sobrepõem, você vê antes e decide se mantém.' },
  { icone: 'ph:lock-simple', titulo: 'Seus clientes, só seus', texto: 'Cada profissional vê apenas a própria carteira.' },
];
---
<section class="previa relative overflow-hidden py-20 sm:py-28">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <div class="mx-auto max-w-[40ch] text-center">
      <h2 class="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">O seu dia, aberto no Telegram.</h2>
      <p class="mt-4 text-[18px] leading-relaxed">Agenda, clientes e valores a receber no mesmo lugar onde você já conversa.</p>
    </div>
    <div class="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
      <ul class="order-2 flex flex-col gap-5 lg:order-1 lg:items-end lg:text-right" x-data x-intersect.once="$el.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('in'))">
        {esquerda.map((d, i) => (
          <li data-reveal style={`--i:${i}`} class="max-w-[30ch]"><Icon name={d.icone} class="mb-2 size-6 text-accent lg:ml-auto" aria-hidden="true" /><span class="display text-[18px] font-semibold text-ink">{d.titulo}</span><p class="mt-1 text-[16px] leading-relaxed">{d.texto}</p></li>
        ))}
      </ul>
      <div class="relative order-1 mx-auto lg:order-2" role="img" aria-label="Exemplo da JornadaPet no Telegram: agenda do dia com três sessões e R$ 1.240 a receber">
        <div class="blob b3 -left-16 top-10 size-72"></div>
        <div class="blob b2 -right-16 bottom-0 size-72"></div>
        <div class="relative w-[300px] rounded-[44px] border border-line bg-ink p-2.5 shadow-[0_30px_60px_-30px_rgba(24,24,27,.5)] dark:bg-[#2a2a2e]" aria-hidden="true">
          <div class="flex h-[580px] flex-col overflow-hidden rounded-[36px] bg-surface">
            <div class="flex items-center gap-3 border-b border-line px-4 pt-6 pb-3">
              <Icon name="ph:x" class="size-4 text-mute" />
              <div class="flex flex-1 items-center gap-2"><Simbolo tamanho="sm" forma="circulo" /><span class="text-[14px] font-semibold text-ink">JornadaPet</span></div>
              <Icon name="ph:dots-three-vertical" class="size-4 text-mute" />
            </div>
            <div class="flex-1 space-y-4 overflow-hidden p-4 text-[14px] text-body">
              <div><div class="text-[12px] text-mute">Bom dia, Camila</div><div class="display text-[20px] font-bold text-ink">Hoje você tem 3 sessões</div></div>
              <div class="flex items-center justify-between r-ctl bg-butter p-3"><div class="text-[14px] text-ink/80">Falta receber</div><div class="text-[20px] font-bold tabular-nums text-ink">R$ 1.240</div></div>
              <ol class="space-y-2">
                <li class="flex items-center gap-3 r-ctl border border-line p-2.5"><span class="w-11 font-semibold text-ink">08:00</span><span class="flex-1 text-ink">Mel</span><span class="flex items-center gap-1 text-[12px] text-accent"><Icon name="ph:check-circle-fill" class="size-3.5" /> Feito</span></li>
                <li class="flex items-center gap-3 r-ctl border border-line p-2.5"><span class="w-11 font-semibold text-ink">10:30</span><span class="flex-1 text-ink">Pipoca</span><span class="rounded-full bg-peach px-2 py-0.5 text-[12px] text-ink">Falta</span></li>
                <li class="flex items-center gap-3 r-ctl bg-sky p-2.5"><span class="w-11 font-semibold text-ink">16:00</span><span class="flex-1 font-medium text-ink">Thor</span><span class="text-[12px] text-ink/70">em 2h</span></li>
              </ol>
              <div class="flex items-center justify-center gap-2 r-ctl border border-dashed border-line py-2.5 font-medium text-ink"><Icon name="ph:plus" class="size-4" /> Agendar sessão</div>
            </div>
            <div class="grid grid-cols-3 border-t border-line text-center text-[12px]">
              <span class="py-3 font-semibold text-accent"><Icon name="ph:calendar-blank-fill" class="mx-auto block size-5" />Agenda</span>
              <span class="py-3 text-mute"><Icon name="ph:users" class="mx-auto block size-5" />Clientes</span>
              <span class="py-3 text-mute"><Icon name="ph:wallet" class="mx-auto block size-5" />Financeiro</span>
            </div>
          </div>
        </div>
      </div>
      <ul class="order-3 flex flex-col gap-5" x-data x-intersect.once="$el.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('in'))">
        {direita.map((d, i) => (
          <li data-reveal style={`--i:${i + 2}`} class="max-w-[30ch]"><Icon name={d.icone} class="mb-2 size-6 text-accent" aria-hidden="true" /><span class="display text-[18px] font-semibold text-ink">{d.titulo}</span><p class="mt-1 text-[16px] leading-relaxed">{d.texto}</p></li>
        ))}
      </ul>
    </div>
  </div>
</section>
```

`src/components/ParaQuem.astro`:

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import adestrador from '../assets/adestrador.jpg';
import { PERFIS_DA_PAGINA } from '../data/conteudo';
---
<section id="para-quem" class="scroll-mt-20 bg-surface py-20 sm:py-24">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <h2 class="max-w-[20ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Feito primeiro para adestradores.</h2>
    <p class="mt-4 max-w-[54ch] text-[18px] leading-relaxed">Estamos começando com quem atende sozinho uma carteira de clientes recorrentes. Passeador, creche ou banho e tosa? Fale com a gente também.</p>
    <div class="mt-12 grid auto-rows-[minmax(120px,auto)] gap-3 sm:auto-rows-[minmax(200px,auto)] sm:grid-cols-2 lg:grid-cols-4" x-data x-intersect.once="$el.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('in'))">
      <article data-reveal style="--i:0" class="bento-tile group relative overflow-hidden r-card sm:col-span-2 lg:row-span-2">
        <Image src={adestrador} widths={[480, 720, 900]} sizes="(min-width: 1024px) 560px, 100vw" alt="Bull terrier saltando em um campo aberto" class="absolute inset-0 size-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
        <div class="relative flex h-full min-h-[320px] flex-col justify-end p-6 text-white">
          <span class="mb-3 w-max rounded-full bg-[#e1e7d6] px-3 py-1 text-[12px] font-semibold text-[#2c3f1f]">Agora</span>
          <h3 class="text-[28px] font-bold text-white">Adestradores</h3>
          <p class="mt-1 max-w-[38ch] text-[16px] text-white/90">Autônomos com carteira recorrente. É com vocês que estamos construindo agora.</p>
        </div>
      </article>
      {PERFIS_DA_PAGINA.map((p, i) => (
        <a href="#participe" data-perfil={p.perfil} @click={`$dispatch('perfil', $el.dataset.perfil)`} data-reveal style={`--i:${i + 1}`} class="bento-tile flex overflow-hidden r-card border border-line bg-bg">
          <div class="flex flex-1 flex-col justify-between p-5">
            <h3 class="text-[20px] font-semibold leading-tight">{p.titulo}</h3>
            <span class="flex items-center gap-1.5 text-[14px] font-medium text-ink/80">Quero conversar <Icon name="ph:arrow-right" class="size-4" aria-hidden="true" /></span>
          </div>
          <Image src={p.imagem} width={300} height={300} alt="" class="w-[42%] object-cover" />
        </a>
      ))}
    </div>
  </div>
</section>
```

`src/components/EmEstudo.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
---
<section class="relative overflow-hidden py-16 sm:py-20" aria-labelledby="breve-titulo">
  <div class="blob b1 -top-20 left-[8%] size-80"></div>
  <div class="blob b3 -bottom-24 right-[12%] size-80"></div>
  <div class="relative mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
    <div>
      <span class="inline-flex items-center gap-2 rounded-full bg-lilac px-3 py-1 text-[14px] font-medium text-ink"><Icon name="ph:hourglass-medium" class="size-4" aria-hidden="true" /> Em estudo, sem data</span>
      <h2 id="breve-titulo" class="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-[1.08]">O que estamos estudando.</h2>
      <p class="mt-3 max-w-[40ch] text-[18px] leading-relaxed">Primeiro, o básico bem feito. Estas ideias vieram das conversas com profissionais e ainda não têm data.</p>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="glass r-card p-5">
        <div class="flex items-center gap-2 text-[14px] font-semibold text-ink"><Icon name="ph:microphone" class="size-4 text-accent" aria-hidden="true" /> Pedir por áudio</div>
        <p class="mt-3 text-[18px] font-medium leading-snug text-ink">“Cancela a sessão de hoje do Thor.”</p>
        <p class="mt-2 text-[14px] leading-relaxed">A ideia é que você mande um áudio ou uma mensagem e a JornadaPet entenda e registre. Quando faltar informação, ela pergunta.</p>
      </div>
      <div class="glass r-card p-5">
        <div class="flex items-center gap-2 text-[14px] font-semibold text-ink"><Icon name="ph:note" class="size-4 text-accent" aria-hidden="true" /> Resumo para o tutor</div>
        <p class="mt-3 text-[18px] font-medium leading-snug text-ink">A evolução do pet, sessão a sessão.</p>
        <p class="mt-2 text-[14px] leading-relaxed">Um resumo que você revisa antes de enviar, para o tutor acompanhar o trabalho.</p>
      </div>
    </div>
  </div>
</section>
```

`src/components/Sobre.astro`:

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import { SOCIOS } from '../data/conteudo';
const blocos = [
  { icone: 'ph:wrench', titulo: 'Em construção', texto: 'Acesso pelo Telegram, carteira de clientes, agenda e valores a receber.', classe: 'border border-line bg-bg' },
  { icone: 'ph:flask', titulo: 'Em estudo', texto: 'Pedidos por áudio e resumo da sessão para o tutor.', classe: 'bg-lilac' },
  { icone: 'ph:magnifying-glass', titulo: 'Ainda descobrindo', texto: 'Preço, quais profissionais mais precisam disso e se o Telegram é o canal certo.', classe: 'border border-line bg-bg' },
];
---
<section id="sobre" class="scroll-mt-20 bg-surface py-20 sm:py-28">
  <div class="mx-auto max-w-6xl px-4 sm:px-6">
    <h2 class="max-w-[24ch] text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-[1.12]">Uma empresa pequena, que prefere ouvir antes de vender.</h2>
    <div class="mt-8 grid gap-6 text-[18px] leading-relaxed md:grid-cols-2 md:gap-12">
      <p>A JornadaPet nasceu de conversas com adestradores sobre a rotina de quem trabalha sozinho: atender bem, manter a agenda em ordem e lembrar quem ainda falta pagar, tudo ao mesmo tempo.</p>
      <p>Hoje estamos transformando essas conversas em produto, começando pelo básico. Somos dois sócios, e respondemos pessoalmente quem se inscreve.</p>
    </div>
    <div class="mt-14 grid gap-3 md:grid-cols-3">
      {blocos.map((b) => (
        <div class:list={['r-card p-6', b.classe]}><div class="flex items-center gap-2 text-[14px] font-semibold text-ink"><Icon name={b.icone} class="size-4" aria-hidden="true" /> {b.titulo}</div><p class="mt-3 text-[16px] leading-relaxed text-ink/85">{b.texto}</p></div>
      ))}
    </div>
    <div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
      {SOCIOS.map((s) => (
        <div class="flex items-center gap-3">
          <Image src={s.foto} width={56} height={56} densities={[1, 2]} alt="" class="size-14 rounded-full object-cover ring-2 ring-[#e1e7d6]" />
          <a href={s.linkedin} target="_blank" rel="noopener" class="group flex items-center gap-1.5 font-semibold text-ink hover:text-accent">{s.nome} <Icon name="ph:linkedin-logo" class="size-[18px] text-mute group-hover:text-accent" aria-hidden="true" /><span class="sr-only">(LinkedIn, abre em nova aba)</span></a>
        </div>
      ))}
      <span class="text-[14px] text-mute">Sócios da <a href="https://arrayof.com.br" target="_blank" rel="noopener" class="font-medium text-ink underline decoration-line decoration-2 hover:decoration-accent">ArrayOf</a></span>
    </div>
  </div>
</section>
```

Em `src/pages/index.astro`, na ordem: `<Hero />`, `<ComoFunciona />`, `<Previa />`, `<ParaQuem />`, `<EmEstudo />`, `<Sobre />` (com os imports).

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test && npm run test:e2e -- tests/e2e/secoes.spec.ts` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src tests
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: previa do mini app, para quem, em estudo e sobre

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 9: Participe — formulário com e sem JS, e `/obrigado`

**Files:**
- Create: `src/scripts/formulario.ts`, `src/components/Participe.astro`, `src/pages/obrigado.astro`, `tests/e2e/formulario.spec.ts`
- Modify: `src/scripts/alpine.ts`, `src/pages/index.astro`

**Interfaces:**
- Consumes: `mascararWhatsapp` (T2); `validar`, `validarCampo`, `primeiroCampoComErro`, `PERFIS`, `type Campo`, `type Dados` (T3); `guardarOrigem`, `CHAVES_DE_ORIGEM`, `type Origem` (T4); `montarEnvio`, `enviar`, `TEXTO_DO_ACEITE` (T4); evento `perfil` (T8); `formVisivel` da `pagina` (T5).
- Produces: `Alpine.data('formulario', (endpoint: string, chave: string, urlObrigado: string) => …)` com `f: Dados`, `isca: boolean`, `err: Erros`, `status: 'idle'|'enviando'|'ok'|'erro'`, `origem: Origem`, `primeiroNome: string`, `whatsEnviado: string`, `mascarar()`, `tocar(c: Campo)`, `enviarFormulario()`, `recomecar()`.

- [ ] **Step 1: Teste e2e que falha**

`tests/e2e/formulario.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

const SERVICO = 'https://api.web3forms.com/submit';

async function preencher(page: Page) {
  await page.getByLabel('Seu nome').fill('  Camila Duarte ');
  await page.getByLabel('WhatsApp').fill('+55 19 99876-1234');
  await page.locator('label.chip-opt', { hasText: 'Adestramento' }).click();
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
}

test('envio vazio mostra os erros e foca o primeiro campo da tela', async ({ page }) => {
  await page.goto('/#participe');
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByText('Diga como podemos chamar você.')).toBeVisible();
  await expect(page.getByText('Precisamos do seu aceite para entrar em contato.')).toBeVisible();
  await expect(page.getByLabel('Seu nome')).toBeFocused();
  await expect(page.getByLabel('Seu nome')).toHaveAttribute('aria-invalid', 'true');
});

test('envio com sucesso: corpo certo, agradece pelo primeiro nome e repete o WhatsApp', async ({ page }) => {
  let corpo: Record<string, string> = {};
  await page.route(SERVICO, async (r) => { corpo = r.request().postDataJSON(); await r.fulfill({ json: { success: true } }); });
  await page.goto('/?utm_source=instagram&ref=marcos#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
  await expect(page.getByText('(19) 99876-1234')).toBeVisible();
  expect(corpo).toMatchObject({ access_key: 'chave-de-teste', nome: 'Camila Duarte', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: 'Campinas, SP', utm_source: 'instagram', ref: 'marcos' });
});

test('erro do serviço mantém os dados e permite tentar de novo', async ({ page }) => {
  let vezes = 0;
  await page.route(SERVICO, async (r) => { vezes++; await r.fulfill(vezes === 1 ? { status: 500, json: { success: false } } : { json: { success: true } }); });
  await page.goto('/#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('alert')).toContainText('Não conseguimos enviar agora');
  await expect(page.getByLabel('Seu nome')).toHaveValue('Camila Duarte');
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
});

test('duplo clique envia uma vez', async ({ page }) => {
  let vezes = 0;
  await page.route(SERVICO, async (r) => { vezes++; await new Promise((ok) => setTimeout(ok, 300)); await r.fulfill({ json: { success: true } }); });
  await page.goto('/#participe');
  await preencher(page);
  await page.getByRole('button', { name: 'Pedir meu convite' }).dblclick();
  await expect(page.getByRole('heading', { name: 'Recebemos, Camila!' })).toBeVisible();
  expect(vezes).toBe(1);
});

test('cartão do Para quem marca o perfil no formulário', async ({ page }) => {
  await page.goto('/');
  await page.locator('#para-quem a[data-perfil="Creche ou hotel"]').click();
  await expect(page.locator('input[name="perfil"][value="Creche ou hotel"]')).toBeChecked();
});

test('envia sem JS e chega ao obrigado', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.route(SERVICO, async (r) => {
    const dados = new URLSearchParams(r.request().postData() ?? '');
    expect(dados.get('nome')).toBe('Camila Duarte');
    await r.fulfill({ status: 303, headers: { location: dados.get('redirect') ?? '' } });
  });
  await page.goto('/#participe');
  await page.getByLabel('Seu nome').fill('Camila Duarte');
  await page.getByLabel('WhatsApp').fill('(19) 99876-1234');
  await page.locator('input[name="perfil"][value="Adestramento"]').check({ force: true });
  await page.getByLabel('Cidade e estado').fill('Campinas, SP');
  await page.getByLabel(/Aceito ser contatado/).check();
  await page.getByRole('button', { name: 'Pedir meu convite' }).click();
  await expect(page).toHaveURL(/\/obrigado$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recebemos seu pedido!');
  await ctx.close();
});

test('barra fixa some quando o formulário está na tela', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'barra só no celular');
  await page.goto('/');
  await page.locator('#sobre').scrollIntoViewIfNeeded();
  await expect(page.locator('.cta', { hasText: 'Quero testar' }).last()).toBeVisible();
  await page.locator('#participe form').scrollIntoViewIfNeeded();
  await expect(page.locator('div.fixed.bottom-0 .cta')).toBeHidden();
});
```

> O redirecionamento do teste sem JS usa o campo `redirect` do formulário; em produção é o Web3Forms quem redireciona.

Run: `npm run test:e2e -- tests/e2e/formulario.spec.ts` — Expected: FAIL.

- [ ] **Step 2: Implementar `src/scripts/formulario.ts`**

```ts
import type { Magia } from './tipos';
import { mascararWhatsapp } from '../lib/whatsapp';
import { primeiroCampoComErro, validar, validarCampo, type Campo, type Dados, type Erros } from '../lib/validacao';
import { guardarOrigem, type Origem } from '../lib/utm';
import { enviar, montarEnvio } from '../lib/formulario';

const ID_DO_CAMPO: Record<Campo, string> = { nome: 'f-nome', whatsapp: 'f-whats', perfil: 'f-perfil-0', cidade: 'f-cidade', aceite: 'f-aceite' };

function sessao(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

export interface Formulario {
  f: Dados; isca: boolean; err: Erros; status: 'idle' | 'enviando' | 'ok' | 'erro'; origem: Origem;
  primeiroNome: string; whatsEnviado: string;
  init(): void; mascarar(): void; tocar(c: Campo): void; enviarFormulario(): Promise<void>; recomecar(): void;
}

const vazio = (): Dados => ({ nome: '', whatsapp: '', perfil: '', cidade: '', aceite: false });

export function formulario(endpoint: string, chave: string, urlObrigado: string): Formulario & ThisType<Formulario & Magia> {
  return {
    f: vazio(), isca: false, err: {}, status: 'idle', origem: {}, primeiroNome: '', whatsEnviado: '',
    init() { this.origem = guardarOrigem(sessao(), window.location.search); },
    mascarar() { this.f.whatsapp = mascararWhatsapp(this.f.whatsapp); },
    tocar(c) { this.err = { ...this.err, [c]: validarCampo(c, this.f) || undefined }; },
    async enviarFormulario() {
      if (this.status === 'enviando') return;
      if (this.isca) return;
      this.err = validar(this.f);
      const campo = primeiroCampoComErro(this.err);
      if (campo) { document.getElementById(ID_DO_CAMPO[campo])?.focus(); return; }
      this.status = 'enviando';
      const resultado = await enviar(montarEnvio(this.f, this.origem, { chave, urlObrigado }), endpoint);
      if (resultado === 'ok') {
        this.primeiroNome = this.f.nome.trim().split(/\s+/)[0] ?? '';
        this.whatsEnviado = mascararWhatsapp(this.f.whatsapp);
        this.status = 'ok';
        this.$nextTick(() => this.$refs.sucesso?.focus());
      } else {
        this.status = 'erro';
      }
    },
    recomecar() { this.f = vazio(); this.err = {}; this.status = 'idle'; },
  };
}
```

Em `src/scripts/alpine.ts`, acrescente `import { formulario } from './formulario';` e `Alpine.data('formulario', formulario);`.

- [ ] **Step 3: `src/components/Participe.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import { PERFIS } from '../lib/validacao';
import { CHAVES_DE_ORIGEM } from '../lib/utm';
import { TEXTO_DO_ACEITE } from '../lib/formulario';
import { CONTATO_EMAIL } from '../data/conteudo';

const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT ?? 'https://api.web3forms.com/submit';
const chave = import.meta.env.PUBLIC_FORM_ACCESS_KEY ?? '';
const urlObrigado = new URL('/obrigado', Astro.site).toString();
const args = JSON.stringify([endpoint, chave, urlObrigado]).slice(1, -1);
const beneficios = [
  { icone: 'ph:chats-circle', titulo: 'Uma conversa sobre o seu dia a dia', texto: 'No horário que for melhor para você.' },
  { icone: 'ph:key', titulo: 'Convite para usar antes de todo mundo', texto: 'Sem custo enquanto estivermos testando.' },
  { icone: 'ph:compass', titulo: 'Você ajuda a decidir o que vem primeiro', texto: 'O que você pedir entra na nossa lista de prioridades.' },
];
---
<section id="participe" class="scroll-mt-20 relative overflow-hidden py-20 sm:py-28" x-intersect:enter="formVisivel = true" x-intersect:leave="formVisivel = false">
  <div class="blob b1 top-10 right-[10%] size-[420px]"></div>
  <div class="blob b2 bottom-0 right-[30%] size-[360px]"></div>
  <div class="blob b3 top-1/3 right-0 size-[300px]"></div>
  <div class="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
    <div>
      <h2 class="max-w-[16ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Teste antes de todo mundo.</h2>
      <p class="mt-4 max-w-[44ch] text-[18px] leading-relaxed">O acesso é por convite. Deixe seu contato, e a gente chama você no WhatsApp para conversar e enviar o seu.</p>
      <ul class="mt-8 space-y-5">
        {beneficios.map((b) => (
          <li class="flex gap-4"><span class="grid size-10 shrink-0 place-items-center r-ctl border border-line bg-surface text-accent"><Icon name={b.icone} class="size-5" aria-hidden="true" /></span><div><div class="font-semibold text-ink">{b.titulo}</div><p class="text-[16px]">{b.texto}</p></div></li>
        ))}
      </ul>
    </div>

    <div class="glass r-card p-5 sm:p-8" x-data={`formulario(${args})`} @perfil.window="f.perfil = $event.detail">
      <div x-cloak x-show="status === 'ok'" x-ref="sucesso" tabindex="-1" role="status" class="flex min-h-[420px] flex-col items-start justify-center">
        <span class="grid size-14 place-items-center rounded-full bg-mint text-accent"><Icon name="ph:check-circle-fill" class="size-8" aria-hidden="true" /></span>
        <h3 class="mt-5 break-words text-[28px] font-bold">Recebemos, <span x-text="primeiroNome"></span>!</h3>
        <p class="mt-2 max-w-[38ch] text-[16px] leading-relaxed">Vamos chamar você no WhatsApp <span class="font-semibold text-ink" x-text="whatsEnviado"></span> nos próximos dias.</p>
        <button type="button" class="mt-6 text-[14px] font-medium text-ink underline decoration-line decoration-2 hover:decoration-accent" @click="recomecar()">Enviar outro contato</button>
      </div>

      <form method="post" action={endpoint} x-show="status !== 'ok'" :novalidate="true" @submit.prevent="enviarFormulario()" class="space-y-5">
        <input type="hidden" name="access_key" value={chave} />
        <input type="hidden" name="redirect" value={urlObrigado} />
        <input type="hidden" name="subject" value="Novo pedido de convite: JornadaPet" />
        <input type="hidden" name="from_name" value="Landing JornadaPet" />
        <input type="hidden" name="aceite_texto" value={TEXTO_DO_ACEITE} />
        <input type="hidden" name="pagina" value="/" />
        {CHAVES_DE_ORIGEM.map((k) => <input type="hidden" name={k} :value={`origem.${k} ?? ''`} />)}

        <div class="space-y-2">
          <label for="f-nome" class="block text-[14px] font-semibold text-ink">Seu nome</label>
          <input id="f-nome" name="nome" required minlength="2" autocomplete="name" x-model="f.nome" @blur="tocar('nome')" :aria-invalid="(!!err.nome).toString()" aria-describedby="e-nome" class="field r-ctl w-full px-4 py-3 text-[16px]" />
          <p id="e-nome" aria-live="polite" class="text-[14px] text-danger" x-text="err.nome ?? ''"></p>
        </div>
        <div class="space-y-2">
          <label for="f-whats" class="block text-[14px] font-semibold text-ink">WhatsApp</label>
          <input id="f-whats" name="whatsapp" type="tel" required pattern="[\d\s\(\)\+\-]{10,20}" inputmode="tel" autocomplete="tel-national" placeholder="(11) 98765-4321" x-model="f.whatsapp" @input="mascarar()" @blur="tocar('whatsapp')" :aria-invalid="(!!err.whatsapp).toString()" aria-describedby="h-whats e-whats" class="field r-ctl w-full px-4 py-3 text-[16px]" />
          <p id="h-whats" class="text-[14px] text-mute">Usamos só para falar com você sobre o teste.</p>
          <p id="e-whats" aria-live="polite" class="text-[14px] text-danger" x-text="err.whatsapp ?? ''"></p>
        </div>
        <fieldset class="space-y-2">
          <legend class="mb-2 block text-[14px] font-semibold text-ink">Você trabalha com</legend>
          <div class="flex flex-wrap gap-2">
            {PERFIS.map((p, i) => (
              <label class="chip-opt relative">
                <input type="radio" name="perfil" id={`f-perfil-${i}`} value={p} required={i === 0} x-model="f.perfil" @change="tocar('perfil')" aria-describedby="e-perfil" :aria-invalid="(!!err.perfil).toString()" />
                <span class="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-[14px] hover:border-ink/40">{p}</span>
              </label>
            ))}
          </div>
          <p id="e-perfil" aria-live="polite" class="text-[14px] text-danger" x-text="err.perfil ?? ''"></p>
        </fieldset>
        <div class="space-y-2">
          <label for="f-cidade" class="block text-[14px] font-semibold text-ink">Cidade e estado</label>
          <input id="f-cidade" name="cidade" required minlength="3" autocomplete="address-level2" placeholder="Campinas, SP" x-model="f.cidade" @blur="tocar('cidade')" :aria-invalid="(!!err.cidade).toString()" aria-describedby="e-cidade" class="field r-ctl w-full px-4 py-3 text-[16px]" />
          <p id="e-cidade" aria-live="polite" class="text-[14px] text-danger" x-text="err.cidade ?? ''"></p>
        </div>
        <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" x-model="isca" class="absolute -left-[9999px] size-px opacity-0" aria-hidden="true" />
        <div class="space-y-2">
          <label class="flex min-h-11 items-start gap-3 text-[14px] leading-snug">
            <input type="checkbox" id="f-aceite" name="aceite" value="sim" required x-model="f.aceite" @change="tocar('aceite')" :aria-invalid="(!!err.aceite).toString()" aria-describedby="e-aceite" class="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
            <span>{TEXTO_DO_ACEITE} <a href="/privacidade" class="font-medium text-ink underline">Política de privacidade</a></span>
          </label>
          <p id="e-aceite" aria-live="polite" class="text-[14px] text-danger" x-text="err.aceite ?? ''"></p>
        </div>

        <div x-cloak x-show="status === 'erro'" role="alert" class="flex gap-3 r-ctl border border-danger/40 bg-danger/10 p-3 text-[14px] text-ink">
          <Icon name="ph:warning-circle" class="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <span>Não conseguimos enviar agora. Seus dados continuam aqui: tente de novo em instantes ou escreva para <span class="select-all font-medium">{CONTATO_EMAIL}</span>.</span>
        </div>

        <button type="submit" :disabled="status === 'enviando'" class="cta r-ctl flex w-full items-center justify-center gap-2 px-5 py-4 text-[16px] font-semibold disabled:cursor-progress disabled:opacity-80">
          <span class="inline-flex items-center gap-2" x-show="status !== 'enviando'">Pedir meu convite <Icon name="ph:arrow-right" class="seta size-4" aria-hidden="true" /></span>
          <span class="inline-flex items-center gap-2" x-cloak x-show="status === 'enviando'"><Icon name="ph:circle-notch" class="size-4 animate-spin" aria-hidden="true" /> Enviando…</span>
        </button>
        <p class="text-center text-[14px] text-mute">A gente chama você no WhatsApp.</p>
      </form>
    </div>
  </div>
</section>
```

> As mensagens de erro ficam sempre no DOM, vazias quando não há erro (em vez de `x-show`), para o `aria-live` anunciar a troca.

`src/pages/obrigado.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Rodape from '../components/Rodape.astro';
---
<Base title="Pedido recebido: JornadaPet" description="Recebemos seu pedido de convite para a JornadaPet." noindex>
  <div x-data="pagina">
    <Nav />
    <main id="conteudo" class="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <h1 class="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Recebemos seu pedido!</h1>
      <p class="mt-4 text-[18px] leading-relaxed">A gente chama você no WhatsApp nos próximos dias para conversar e enviar o seu convite.</p>
      <a href="/" class="cta r-ctl mt-8 inline-flex items-center gap-2 px-5 py-3.5 text-[16px] font-semibold">Voltar para a página inicial</a>
    </main>
    <Rodape />
  </div>
</Base>
```

Em `src/pages/index.astro`, coloque `<Participe />` depois de `<Sobre />`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:e2e -- tests/e2e/formulario.spec.ts` — Expected: PASS nos dois projetos.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src tests/e2e/formulario.spec.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: formulario de convite com e sem JS e pagina de obrigado

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 10: Dúvidas comuns

**Files:**
- Create: `src/components/Duvidas.astro`, `tests/e2e/duvidas.spec.ts`
- Modify: `src/data/conteudo.ts`, `src/pages/index.astro`

**Interfaces:**
- Produces: `PERGUNTAS: { pergunta: string; resposta: string }[]` (usado também pelo JSON-LD da Tarefa 11).

- [ ] **Step 1: Dados** — acrescente a `src/data/conteudo.ts`:

```ts
export const PERGUNTAS = [
  { pergunta: 'Quanto vai custar?', resposta: 'Ainda estamos definindo, junto com os profissionais que participam do teste. Enquanto estivermos testando, você não paga nada.' },
  { pergunta: 'Preciso usar o Telegram?', resposta: 'Sim. A JornadaPet funciona dentro do Telegram, no celular e no computador. Se ele não combina com a sua rotina, conte para a gente: é uma das coisas que estamos testando.' },
  { pergunta: 'Como eu entro?', resposta: 'O acesso é por convite. Depois de receber o seu, você confirma o celular por SMS uma única vez e passa a entrar direto pelo Telegram.' },
  { pergunta: 'Meus clientes precisam usar o Telegram?', resposta: 'Não. Só você usa a JornadaPet. A conversa com o tutor continua no seu WhatsApp, como hoje. Um resumo da sessão para o tutor está entre as ideias que estamos estudando.' },
  { pergunta: 'Serve para mensalidade e aula avulsa?', resposta: 'Você registra cada valor combinado com vencimento e cada pagamento, inteiro ou em partes, e vê quanto falta receber. Controle de aulas por pacote e cobrança automática ainda não fazem parte desta primeira versão.' },
  { pergunta: 'E os dados dos meus clientes?', resposta: 'Cada profissional vê apenas a própria carteira, e os dados não são compartilhados. Estamos escrevendo nossa política de dados com base na LGPD.' },
  { pergunta: 'Atendo outros animais além de cães. Posso participar?', resposta: 'Pode se inscrever. Começamos pelos cães, e saber quem atende outros animais nos ajuda a decidir os próximos passos.' },
] as const;
```

- [ ] **Step 2: Teste que falha**

`tests/e2e/duvidas.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('dúvidas abrem sem JS e a primeira já vem aberta', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/#perguntas');
  const itens = page.locator('#perguntas details');
  await expect(itens).toHaveCount(7);
  await expect(itens.first()).toHaveAttribute('open', '');
  await page.getByText('Como eu entro?').click();
  await expect(page.getByText('você confirma o celular por SMS uma única vez')).toBeVisible();
  await ctx.close();
});

test('abrir uma fecha a outra', async ({ page }) => {
  await page.goto('/#perguntas');
  await page.getByText('Preciso usar o Telegram?').click();
  await expect(page.locator('#perguntas details').first()).not.toHaveAttribute('open', '');
});
```

Run: `npm run test:e2e -- tests/e2e/duvidas.spec.ts` — Expected: FAIL.

- [ ] **Step 3: `src/components/Duvidas.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import { PERGUNTAS } from '../data/conteudo';
---
<section id="perguntas" class="scroll-mt-20 bg-surface py-20 sm:py-28">
  <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
    <div class="lg:sticky lg:top-28 lg:self-start">
      <h2 class="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Dúvidas comuns.</h2>
      <p class="mt-4 max-w-[36ch] text-[18px] leading-relaxed">Ficou outra dúvida? Peça seu convite e pergunte na conversa pelo WhatsApp.</p>
    </div>
    <div class="divide-y divide-line border-y border-line">
      {PERGUNTAS.map((q, i) => (
        <details name="duvidas" open={i === 0}>
          <summary class="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[18px] font-semibold text-ink hover:text-accent">
            <span>{q.pergunta}</span>
            <Icon name="ph:plus" class="mais size-5 shrink-0 transition-[rotate] duration-300" aria-hidden="true" />
          </summary>
          <p class="max-w-[60ch] pb-6 text-[16px] leading-relaxed">{q.resposta}</p>
        </details>
      ))}
    </div>
  </div>
</section>
```

Em `src/pages/index.astro`, coloque `<Duvidas />` depois de `<Participe />`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:e2e -- tests/e2e/duvidas.spec.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src tests/e2e/duvidas.spec.ts
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: duvidas comuns com details nativo

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 11: SEO, privacidade, 404, robots, sitemap, ícones e imagem de compartilhamento

**Files:**
- Create: `src/lib/jsonld.ts`, `tests/unit/jsonld.test.ts`, `src/pages/privacidade.astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`, `public/favicon.svg`, `public/site.webmanifest`, `scripts/gerar-og.mjs`, `tests/og/og.html`, `tests/e2e/seo.spec.ts`
- Modify: `src/layouts/Base.astro` (reescrita), `src/pages/index.astro`

**Interfaces:**
- Consumes: `PERGUNTAS`, `SOCIOS`, `CONTATO_EMAIL` (conteúdo).
- Produces: `organizacao(site: URL): object`, `siteWeb(site: URL): object`, `paginaDePerguntas(perguntas: readonly { pergunta: string; resposta: string }[]): object`; `Base` passa a aceitar `jsonLd?: object[]`.

- [ ] **Step 1: Testes que falham**

`tests/unit/jsonld.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { organizacao, paginaDePerguntas, siteWeb } from '../../src/lib/jsonld';

const site = new URL('https://jornadapet.com.br');

describe('JSON-LD', () => {
  it('organização com a ArrayOf como mãe e os sócios como fundadores', () => {
    const o = organizacao(site) as Record<string, any>;
    expect(o['@type']).toBe('Organization');
    expect(o.parentOrganization).toEqual({ '@type': 'Organization', name: 'ArrayOf', url: 'https://arrayof.com.br' });
    expect(o.founder.map((p: any) => p.sameAs)).toEqual(['https://www.linkedin.com/in/jmarioguedes/', 'https://www.linkedin.com/in/trfiladelfo/']);
    expect(o.email).toBe('contato@jornadapet.com.br');
  });
  it('site em pt-BR', () => { expect(siteWeb(site)).toMatchObject({ '@type': 'WebSite', inLanguage: 'pt-BR', url: 'https://jornadapet.com.br/' }); });
  it('perguntas com o mesmo texto da página', () => {
    const f = paginaDePerguntas([{ pergunta: 'P?', resposta: 'R.' }]) as Record<string, any>;
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'P?', acceptedAnswer: { '@type': 'Answer', text: 'R.' } });
  });
});
```

`tests/e2e/seo.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('head com título, descrição, canonical, Open Graph e JSON-LD', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('JornadaPet: agenda e clientes para adestradores de cães');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pt_BR');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  const tipos = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent ?? '{}')['@type']));
  expect(tipos).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));
});

test('robots fora de produção bloqueia tudo', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(await r.text()).toContain('Disallow: /');
});

test('privacidade, obrigado e 404 existem', async ({ page }) => {
  await page.goto('/privacidade');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidade');
  const r = await page.goto('/nao-existe');
  expect(r?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada');
});
```

Run: `npm test && npm run test:e2e -- tests/e2e/seo.spec.ts` — Expected: FAIL.

- [ ] **Step 2: `src/lib/jsonld.ts`**

```ts
import { CONTATO_EMAIL, SOCIOS } from '../data/conteudo';

export function organizacao(site: URL): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JornadaPet',
    url: new URL('/', site).toString(),
    logo: new URL('/favicon.svg', site).toString(),
    email: CONTATO_EMAIL,
    parentOrganization: { '@type': 'Organization', name: 'ArrayOf', url: 'https://arrayof.com.br' },
    founder: SOCIOS.map((s) => ({ '@type': 'Person', name: s.nome, sameAs: s.linkedin })),
  };
}

export function siteWeb(site: URL): object {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'JornadaPet', url: new URL('/', site).toString(), inLanguage: 'pt-BR' };
}

export function paginaDePerguntas(perguntas: readonly { pergunta: string; resposta: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map((q) => ({ '@type': 'Question', name: q.pergunta, acceptedAnswer: { '@type': 'Answer', text: q.resposta } })),
  };
}
```

> O `vi.mock` das imagens da Tarefa 8 vale também aqui: copie as seis linhas `vi.mock('../../src/assets/…')` para o topo de `tests/unit/jsonld.test.ts`.

- [ ] **Step 3: Reescrever `src/layouts/Base.astro`**

```astro
---
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '../styles/global.css';

interface Props { title: string; description: string; noindex?: boolean; jsonLd?: object[] }
const { title, description, noindex = false, jsonLd = [] } = Astro.props;
const indexar = import.meta.env.PUBLIC_INDEXAR === 'true' && !noindex;
const canonical = new URL(Astro.url.pathname, Astro.site);
const imagemOg = new URL('/og.png', Astro.site);
---
<!doctype html>
<html lang="pt-BR" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {!indexar && <meta name="robots" content="noindex, nofollow" />}
    <meta name="theme-color" content="#f4f4f6" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#151613" media="(prefers-color-scheme: dark)" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="JornadaPet" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:title" content="JornadaPet: clientes, agenda e valores a receber do adestrador" />
    <meta property="og:description" content="Tutores, pets, sessões e valores a receber do adestrador autônomo, organizados no Telegram. Acesso por convite." />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={imagemOg} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    {jsonLd.map((d) => <script type="application/ld+json" set:html={JSON.stringify(d)} />)}
    <script is:inline>
      (function () {
        var h = document.documentElement;
        var mm = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
        h.classList.remove('no-js'); h.classList.add('js');
        if (mm('(prefers-color-scheme: dark)')) h.classList.add('dark');
        if (mm('(prefers-reduced-motion: reduce)')) h.classList.add('rm');
        if (mm('(prefers-reduced-transparency: reduce)')) h.classList.add('solid');
        if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) { h.classList.toggle('dark', e.matches); });
      })();
    </script>
  </head>
  <body class="antialiased">
    <a href="#conteudo" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-surface text-ink px-4 py-2 r-ctl">Pular para o conteúdo</a>
    <slot />
  </body>
</html>
```


Em `src/pages/index.astro`, passe o JSON-LD:

```astro
---
import { organizacao, paginaDePerguntas, siteWeb } from '../lib/jsonld';
import { PERGUNTAS } from '../data/conteudo';
const site = Astro.site ?? new URL('https://jornadapet.com.br');
const jsonLd = [organizacao(site), siteWeb(site), paginaDePerguntas(PERGUNTAS)];
---
```

e `<Base … jsonLd={jsonLd}>`.

- [ ] **Step 4: Páginas e arquivos de apoio**

`src/pages/robots.txt.ts`:

```ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const indexar = import.meta.env.PUBLIC_INDEXAR === 'true';
  const corpo = indexar
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(corpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

`src/pages/404.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Rodape from '../components/Rodape.astro';
---
<Base title="Página não encontrada: JornadaPet" description="Esta página não existe." noindex>
  <div x-data="pagina">
    <Nav />
    <main id="conteudo" class="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <h1 class="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Página não encontrada</h1>
      <p class="mt-4 text-[18px] leading-relaxed">O endereço pode ter mudado. A página inicial tem tudo sobre a JornadaPet.</p>
      <a href="/" class="cta r-ctl mt-8 inline-flex items-center gap-2 px-5 py-3.5 text-[16px] font-semibold">Ir para a página inicial</a>
    </main>
    <Rodape />
  </div>
</Base>
```

`src/pages/privacidade.astro` — a estrutura é fixa; os textos marcados vêm dos sócios (spec §10.2). **O build de produção falha enquanto houver pendência**:

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Rodape from '../components/Rodape.astro';
import { CONTATO_EMAIL } from '../data/conteudo';

/** Troque para false quando os sócios entregarem o texto final (spec §10.2). */
const PENDENTE = true;
if (PENDENTE && import.meta.env.PUBLIC_INDEXAR === 'true') {
  throw new Error('Política de privacidade pendente: preencha src/pages/privacidade.astro antes de publicar (spec §10.2).');
}
const secoes = [
  { titulo: 'Quem cuida dos seus dados', texto: 'A ArrayOf, empresa responsável pela JornadaPet, é a controladora dos dados enviados por esta página.' },
  { titulo: 'O que coletamos', texto: 'Nome, WhatsApp, área de atuação, cidade e estado, o aceite de contato e, quando houver, a origem da visita (parâmetros utm e ref do link).' },
  { titulo: 'Para que usamos', texto: 'Para falar com você sobre o teste da JornadaPet e enviar o seu convite. Nada além disso.' },
  { titulo: 'Com quem compartilhamos', texto: 'O envio passa pelo serviço de formulários que usamos para receber os pedidos. Não vendemos nem cedemos seus dados.' },
  { titulo: 'Por quanto tempo guardamos', texto: '[Preencher pelos sócios: prazo de guarda dos pedidos de convite.]' },
  { titulo: 'Seus direitos', texto: `Você pode pedir acesso, correção ou remoção dos seus dados escrevendo para ${CONTATO_EMAIL}.` },
];
---
<Base title="Política de privacidade: JornadaPet" description="Como a JornadaPet trata os dados enviados pelo formulário de convite.">
  <div x-data="pagina">
    <Nav />
    <main id="conteudo" class="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 class="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05]">Política de privacidade</h1>
      {PENDENTE && <p class="mt-4 r-ctl bg-butter p-3 text-[14px] text-ink">Rascunho em revisão. Esta versão ainda não é a final.</p>}
      {secoes.map((s) => (
        <section class="mt-10">
          <h2 class="text-[20px] font-semibold">{s.titulo}</h2>
          <p class="mt-2 text-[16px] leading-relaxed">{s.texto}</p>
        </section>
      ))}
    </main>
    <Rodape />
  </div>
</Base>
```

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#e1e7d6"/><g transform="translate(4.6 3.2) scale(0.8)" fill="none" stroke="#3f5a2c" stroke-width="3.6" stroke-linecap="round"><path d="M20 4.5V18.5a7.25 7.25 0 0 1-14.5 0"/><circle cx="5.5" cy="13.75" r="3"/></g></svg>
```

`public/site.webmanifest`:

```json
{ "name": "JornadaPet", "short_name": "JornadaPet", "icons": [{ "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }], "theme_color": "#3f5a2c", "background_color": "#f4f4f6", "display": "browser", "lang": "pt-BR" }
```

`tests/og/og.html` (imagem de compartilhamento, 1200×630, conteúdo centralizado para o recorte quadrado do WhatsApp):

```html
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Instrument+Sans:wght@500&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:1200px;height:630px;display:grid;place-items:center;background:#f4f4f6;font-family:"Instrument Sans",sans-serif;color:#23251f;overflow:hidden;position:relative}
  .b{position:absolute;border-radius:50%;filter:blur(60px);opacity:.9}
  .c{position:relative;display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center;width:640px}
  .s{width:96px;height:96px;border-radius:24px;background:#e1e7d6;display:grid;place-items:center}
  h1{font-family:"Bricolage Grotesque",sans-serif;font-size:58px;line-height:1.04;letter-spacing:-.025em;margin:0}
  .n{background:rgba(255,255,255,.75);border:1px solid #fff;border-radius:16px;padding:14px 22px;font-size:26px;box-shadow:0 18px 40px -22px rgba(64,48,32,.35)}
  .n b{color:#3f5a2c}
</style></head>
<body>
  <div class="b" style="width:420px;height:420px;background:#ecd2b2;left:-60px;top:-80px"></div>
  <div class="b" style="width:380px;height:380px;background:#cdd6bd;right:-40px;bottom:-90px"></div>
  <div class="c">
    <div class="s"><svg width="58" height="66" viewBox="-1.75 -1 26 32" fill="none" stroke="#3f5a2c" stroke-width="3.2" stroke-linecap="round"><path d="M20 4.5V18.5a7.25 7.25 0 0 1-14.5 0"/><circle cx="5.5" cy="13.75" r="3"/></svg></div>
    <h1>Adestrador: saiba quem já pagou e quem ainda falta.</h1>
    <div class="n"><b>✓</b> Marina pagou R$ 100</div>
  </div>
</body></html>
```

`scripts/gerar-og.mjs`:

```js
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const raiz = new URL('..', import.meta.url);
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.goto(new URL('tests/og/og.html', raiz).href);
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: fileURLToPath(new URL('public/og.png', raiz)) });

const icone = await navegador.newPage({ viewport: { width: 180, height: 180 } });
await icone.setContent(`<body style="margin:0"><img src="data:image/svg+xml,${encodeURIComponent((await import('node:fs')).readFileSync(new URL('public/favicon.svg', raiz), 'utf8'))}" width="180" height="180"></body>`);
await icone.screenshot({ path: fileURLToPath(new URL('public/apple-touch-icon.png', raiz)) });
await navegador.close();
console.log('public/og.png e public/apple-touch-icon.png gerados');
```

Run: `npm run og` — Expected: `public/og.png e public/apple-touch-icon.png gerados`. Abra `public/og.png` e confira o enquadramento.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test && npm run test:e2e -- tests/e2e/seo.spec.ts` — Expected: PASS.
Run: `PUBLIC_INDEXAR=true npx astro build` — Expected: FALHA com "Política de privacidade pendente" (a trava funciona). Depois rode `npx astro build` sem a variável para voltar ao estado normal.

- [ ] **Step 6: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add src public scripts tests
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "feat: SEO, JSON-LD, robots, sitemap, privacidade, 404 e imagem de compartilhamento

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Tarefa 12: Verificação final — acessibilidade, celular, tema, movimento

**Files:**
- Create: `tests/e2e/qualidade.spec.ts`
- Modify: `docs/notas-tecnicas/NT-001-landing-page.md`, `docs/README.md`

- [ ] **Step 1: Teste**

`tests/e2e/qualidade.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const tema of ['light', 'dark'] as const) {
  test(`sem violações de acessibilidade (${tema})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: tema });
    await page.goto('/');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test('sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('com reduzir movimento nada anima', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('com reduzir transparência o vidro fica sólido', async ({ page }) => {
  await page.addInitScript(() => document.documentElement.classList.add('solid'));
  await page.goto('/');
  expect(await page.locator('.glass').first().evaluate((e) => getComputedStyle(e).backdropFilter)).toBe('none');
});

test('nenhum travessão em texto visível', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('body').innerText()).not.toMatch(/[—–]/);
});

test('um h1 só, e títulos sem saltos', async ({ page }) => {
  await page.goto('/');
  const niveis = await page.locator('h1, h2, h3, h4').evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
  expect(niveis.filter((n) => n === 1)).toHaveLength(1);
  for (let i = 1; i < niveis.length; i++) expect(niveis[i] - niveis[i - 1]).toBeLessThanOrEqual(1);
});
```

Run: `npm run test:e2e` — Expected: toda a suíte PASS nos dois projetos. Corrija o que o axe apontar no componente dono e rode de novo.

- [ ] **Step 2: Checklist manual (anote os números no NT-001 §13)**

- [ ] `npm run build && npm run preview`; Lighthouse no Chrome, modo celular, em `http://localhost:4321/`: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO 100 (o SEO local acusa o `noindex`; rode também com `PUBLIC_INDEXAR=true` e `PENDENTE=false` temporário, sem commitar).
- [ ] Comparar com o protótipo v2 lado a lado em 1440 e 375 px, claro e escuro.
- [ ] Um envio real ao serviço escolhido, com `PUBLIC_FORM_ACCESS_KEY` verdadeira, e conferir a chegada do e-mail.

- [ ] **Step 3: Documentação** — acrescente ao `docs/notas-tecnicas/NT-001-landing-page.md` uma seção `## 13. Implementação` com: versão do Astro, resultado do Lighthouse, desvios da spec (com motivo) e o que ficou para os sócios (spec §10). No `docs/README.md`, mude o estado da frente para "implementada, aguardando pendências dos sócios".

- [ ] **Step 4: Commit**

```bash
git -c safe.directory=E:/ArrayOF/jp/landing_page add tests/e2e/qualidade.spec.ts docs/notas-tecnicas/NT-001-landing-page.md docs/README.md
git -c safe.directory=E:/ArrayOF/jp/landing_page commit -m "test: acessibilidade, celular, tema e movimento; docs da implementacao

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

## Checklist de publicação (não é tarefa de código; bloqueia o go-live)

Itens da spec §10, todos dos sócios: serviço do formulário e e-mail de destino; texto da política (e `PENDENTE = false`); domínio + hospedagem (Cloudflare Pages: build `npm run build`, saída `dist`, variáveis `PUBLIC_*` com `PUBLIC_INDEXAR=true` só em produção); número de WhatsApp; as duas frases que prometem algo; licença das fotos (ou troca); checagem de marca no INPI e dos @.
