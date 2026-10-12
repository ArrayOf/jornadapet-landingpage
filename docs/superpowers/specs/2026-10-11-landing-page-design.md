# Design — landing page da JornadaPet

**Data:** 2026-10-11
**Status:** Escrita em 11/10/2026, aguardando revisão — nada implementado
**Autor:** Thiago Filadelfo + Claude (Opus 5.5)
**Protótipo:** [`NT-001-landing-page-v2.html`](../../notas-tecnicas/prototipos/NT-001-landing-page-v2.html) ·
link compartilhável: <https://claude.ai/artifact/BrtZ8agaS62DGrbHwVaiem>
(v1, histórico: <https://claude.ai/artifact/VRU8PiqxEZoqFk3Nm43s7C>)
**Nota técnica:** [`NT-001`](../../notas-tecnicas/NT-001-landing-page.md) — §0 (o que mudou com a
versão 1 do produto), §8–§9 (revisões de SEO, UX, marketing e design), §10 (branding), §11 (paleta)
**Design system:** [`DESIGN.md`](../../../DESIGN.md)
**Produto:** [ArrayOf/jornada-pet](https://github.com/ArrayOf/jornada-pet), em especial
`planejamento/versao-1/` e `discovery/`

---

## 1. Problema

A JornadaPet não tem presença pública. Os sócios precisam:

- **apresentar a empresa** — o que a JornadaPet faz, para quem, em que fase está e quem está por trás;
- **captar profissionais** para as conversas e o teste da versão 1, que é **por convite** (a Conta
  do produto nasce de um convite enviado pelo WhatsApp).

A versão 1 do produto (definida em 11/10/2026) é uma ferramenta de **gestão** no Telegram (Mini
App): Conta por convite, Carteira de clientes, Agendamento e Gestão financeira. Registro de
evolução, resumo para o tutor e a interface por áudio e IA ficaram para depois, sem data. Preço não
está validado. A página não pode prometer nada além disso.

## 2. Decisões

1. **O protótipo v2 é a referência visual, de texto e de comportamento.** Onde esta spec é omissa,
   vale o que o protótipo faz. Onde o protótipo tem coisa só de protótipo (painel "Protótipo",
   envio simulado, fotos do placedog.net), vale esta spec.
2. **O `DESIGN.md` é a referência de tokens e componentes.** Paleta E (oliva `#3f5a2c` como única
   cor de ação, caramelo só como destaque, pastéis com significado fixo), Bricolage Grotesque +
   Instrument Sans, três raios, claro e escuro.
3. **Uma página (`/`) + política de privacidade (`/privacidade`) + confirmação sem JS
   (`/obrigado`).** Site estático, sem backend próprio.
4. **Stack:** Astro (saída estática), Tailwind CSS v4 pelo plugin do Vite, Alpine.js para estado
   de interface. Nada de framework de componentes no cliente.
5. **Todo conteúdo legível sai no HTML estático.** Passos, perguntas, perfis e opções do
   formulário são dados no código-fonte renderizados pelo Astro; o Alpine só guarda estado (aba
   ativa, item aberto, envio). Sem `x-for`/`x-text` para conteúdo.
6. **O formulário funciona sem JS** (`<form method="post" action=…>` para o serviço externo, com
   redirecionamento para `/obrigado`). Com JS, o envio é por `fetch` e o resultado aparece na
   própria página, como no protótipo.
7. **Serviço do formulário padrão: Web3Forms**, atrás de um módulo único (`src/lib/formulario.ts`)
   para poder trocar. **A confirmar pelos sócios** antes de publicar (os dados passam pelo
   fornecedor — ver §10).
8. **Hospedagem padrão: Cloudflare Pages**, publicando `dist/`. **A confirmar** junto com o domínio
   (`jornadapet.com.br`, não confirmado).
9. **Não entram:** preço, mascote/ilustração 3D (só referência de cor, NT-001 §11), blog, páginas
   por perfil, painel "Protótipo", rastreio de terceiros (Google Analytics, pixel). Medição, se
   houver, será decidida depois.

## 3. Seções e conteúdo

A ordem e o texto são os do protótipo v2. Resumo, com o que a implementação precisa garantir:

| # | Seção | Conteúdo (fonte: protótipo v2) | Garantias |
| --- | --- | --- | --- |
| 1 | Hero | Selo "Em construção, ouvindo adestradores"; H1 **"Adestrador: saiba quem já pagou e quem ainda falta."**; subtítulo; "Quero testar"; "Ver como funciona"; linha "Acesso por convite. A gente chama você no WhatsApp."; foto + conversa do bot (`/start` → "Abrir JornadaPet") + nota "Marina pagou R$ 100" | H1 em no máximo 3 linhas no desktop; a imagem do hero é o LCP e **não** tem fade de opacidade |
| 2 | Como funciona | "Cliente, sessão e pagamento, num lugar só."; abas **Cadastre / Agende / Acompanhe**; palco com ficha do pet, agenda do dia, valor a receber; botão "Quero testar" ao fim | Troca automática de 6 s **só no desktop**, pausa com ponteiro/foco e botão de pausar; teclado por setas; painéis inativos com `inert` |
| 3 | Prévia | "O seu dia, aberto no Telegram."; celular com a agenda do dia e "Falta receber"; quatro destaques | Exemplos marcados como ilustração (`role="img"`/`aria-label`) |
| 4 | Para quem | "Feito primeiro para adestradores."; destaque "Adestradores — Agora"; quatro perfis que levam ao formulário com o perfil marcado | Cada perfil é um `<a href="#participe">` que marca o perfil |
| 5 | O que estamos estudando | Selo lilás "Em estudo, sem data"; pedir por áudio; resumo para o tutor | Nada aqui pode ser lido como pronto |
| 6 | Sobre | "Uma empresa pequena, que prefere ouvir antes de vender."; dois parágrafos; blocos Em construção / Em estudo / Ainda descobrindo; sócios com foto e LinkedIn; "Sócios da ArrayOf" | Fotos otimizadas; links externos com `rel="noopener"` |
| 7 | Participe | "Teste antes de todo mundo."; três benefícios; formulário | §4 |
| 8 | Dúvidas comuns | Sete perguntas do protótipo v2 | `<details>/<summary>` (abre sem JS); primeira aberta |
| 9 | Rodapé | Marca, frase, links, e-mail, "JornadaPet é um produto da ArrayOf." | Link para `/privacidade` real |

**Barra fixa no celular** (< 768 px): "Quero testar", visível quando nem o botão do hero nem o
formulário estão na tela.

**Texto:** sem travessão em texto visível; "tutor" e "pet" em minúsculas no texto corrido; um
rótulo por intenção ("Quero testar" para ir ao formulário, "Pedir meu convite" para enviar).

## 4. Formulário

- **Campos:** nome (obrigatório, ≥ 2 caracteres), WhatsApp (obrigatório, 10–11 dígitos com DDD,
  máscara `(11) 98765-4321`, aceita colar `+55`), perfil (obrigatório, um de: Adestramento,
  Passeio ou pet sitter, Creche ou hotel, Banho e tosa, Veterinária, Outro), cidade e estado
  (obrigatório, ≥ 3 caracteres), aceite de contato (obrigatório). Campo-isca escondido fora da tela.
- **Campos ocultos:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `ref` (lidos da URL
  e guardados na sessão do navegador para sobreviver à navegação interna), `pagina` (`/`).
- **Validação:** as mesmas regras no cliente (ao sair do campo e ao enviar) e expressas também em
  HTML (`required`, `minlength`, `pattern`) para o envio sem JS. Mensagens do protótipo v2. Foco no
  primeiro campo inválido, na ordem da tela.
- **Estados:** enviando ("Enviando…", botão desabilitado), sucesso (agradece pelo primeiro nome e
  repete o WhatsApp, foco no título), erro (dados mantidos, aviso com o e-mail de contato).
- **Sem JS:** `POST` direto ao serviço, que redireciona para `/obrigado` (mesma mensagem de sucesso,
  sem o nome).
- **Privacidade:** nada do formulário vai para log, analytics ou URL. O aceite registra o texto
  aceito (campo oculto `aceite_texto`) junto com o envio.

## 5. Arquitetura

```text
landing_page/
├── DESIGN.md
├── astro.config.mjs            # site, integrações (alpinejs, sitemap, icon), vite: tailwindcss()
├── src/
│   ├── styles/global.css       # @import "tailwindcss"; @theme inline; tokens claro/escuro; base
│   ├── layouts/Base.astro      # <head> (SEO, OG, JSON-LD, fontes, tema), skip link, slot
│   ├── data/                   # conteúdo como dados tipados: passos, perfis, perguntas, sócios
│   ├── lib/                    # funções puras testáveis: whatsapp.ts, validacao.ts, utm.ts, formulario.ts
│   ├── scripts/alpine.ts       # Alpine.data('stepper'|'formulario'|'pagina'), plugins intersect e collapse
│   ├── components/             # Nav, Hero, ComoFunciona, Previa, ParaQuem, EmEstudo, Sobre, Participe, Duvidas, Rodape, BarraCelular, Simbolo
│   └── pages/                  # index.astro, privacidade.astro, obrigado.astro, 404.astro
├── public/                     # favicon.svg, apple-touch-icon.png, og.png, robots.txt, site.webmanifest
└── tests/                      # unit (Vitest) e e2e (Playwright)
```

- **Tema:** classe `.dark` em `<html>`, decidida por um script inline no `<head>` a partir de
  `prefers-color-scheme` (sem botão de tema no site público). Tokens em CSS no `:root` e `.dark`;
  Tailwind lê pelos `@theme inline` com nomes próprios (`--f-display`, `--f-sans` — **não**
  `--font-*`, que o Tailwind anula; NT-001 §7).
- **Fontes:** Fontsource variável (`@fontsource-variable/bricolage-grotesque`,
  `@fontsource-variable/instrument-sans`), subconjunto latino, `font-display: swap`, `preload` só da
  Bricolage do H1.
- **Ícones:** `astro-icon` com `@iconify-json/ph` (SVG inline no build). Nada de fonte de ícones.
- **Imagens:** `astro:assets` (`<Picture>` AVIF/WebP, `srcset`, `sizes`); hero com
  `fetchpriority="high"` e sem `loading="lazy"`; o resto lazy.
- **Alpine:** pela integração `@astrojs/alpinejs` com `entrypoint` em `src/scripts/alpine.ts`.
  Componentes de estado registrados com `Alpine.data`; nenhuma lógica de regra no HTML — validação,
  máscara e UTM chamam `src/lib/`.
- **Motion:** como no `DESIGN.md` (Elevation & Depth). Conteúdo **visível por padrão**: revelação só
  desliza (`transform`), nunca começa em `opacity: 0`. Tudo desligado com `prefers-reduced-motion`;
  vidro sólido com `prefers-reduced-transparency`.

## 6. SEO e compartilhamento

- `<title>`: **"JornadaPet: agenda e clientes para adestradores de cães"**; description: "Organize
  tutores, pets, sessões e valores a receber do seu trabalho de adestramento no Telegram, sem
  instalar outro app. Acesso por convite."
- `lang="pt-BR"`, canonical absoluto a partir de `site`, `og:*` (`og:locale=pt_BR`, imagem
  1200×630: fundo neutro, símbolo, título e a nota "Marina pagou R$ 100", tudo centralizado),
  `twitter:card=summary_large_image`.
- JSON-LD: `Organization` (JornadaPet, `parentOrganization` ArrayOf `https://arrayof.com.br`,
  `founder`: Mario Guedes e Thiago Filadelfo como `Person` com `sameAs` do LinkedIn, `email`) e
  `WebSite`. **Sem** `SoftwareApplication` antes do lançamento. `FAQPage` com o texto idêntico ao
  visível.
- `@astrojs/sitemap`, `robots.txt` apontando o sitemap; `noindex` fora de produção (variável de
  ambiente `PUBLIC_INDEXAR=false` por padrão).

## 7. Acessibilidade

WCAG 2.2 AA: contrastes do `DESIGN.md`; foco visível em oliva; alvos de toque ≥ 44 px; skip link;
um `h1`; hierarquia de títulos sem saltos (exemplos de interface sem `h3`); rótulo acima de cada
campo; erros ligados por `aria-describedby` e anunciados (`aria-live="polite"`); menu do celular com
foco preso, Esc fecha e devolve o foco; nenhuma informação só por cor.

## 8. Desempenho

Orçamento em celular (Lighthouse, 4G simulado): **LCP < 2,5 s, CLS < 0,1, INP < 200 ms,
Performance ≥ 90, Acessibilidade ≥ 95, SEO 100**. JS do cliente só Alpine + plugins + o módulo da
página. Blobs com `blur` em no máximo três por seção e desligados abaixo de 768 px se o Lighthouse
apontar custo de pintura.

## 9. Verificação

- **Unitários (Vitest):** máscara e normalização do WhatsApp (incluindo `+55`), regras de
  validação, leitura e guarda de UTM, montagem do corpo do envio.
- **Ponta a ponta (Playwright, contra o `astro preview`):** carga sem erro de console; conteúdo
  visível sem JS (FAQ, passos, perfis); formulário — erros, foco, envio com sucesso e com erro
  (serviço simulado por interceptação de rede), envio sem JS chega a `/obrigado`; perfil marcado
  pelo cartão do "Para quem"; barra fixa no celular; `prefers-reduced-motion` sem animação; 375 px
  sem rolagem horizontal; tema escuro.
- **Manual antes de publicar:** Lighthouse no celular, revisão visual contra o protótipo v2 em
  1440 e 375 px, claro e escuro, e um envio real ao serviço escolhido.

## 10. Pendências dos sócios (bloqueiam a publicação, não a implementação)

1. **Serviço do formulário** (Web3Forms por padrão) e o e-mail que recebe as inscrições.
2. **Texto da política de privacidade** (`/privacidade`) — quem é o controlador (ArrayOf), o que é
   coletado, para quê, por quanto tempo, com quem é compartilhado (o serviço do formulário), como
   pedir remoção.
3. **Domínio e hospedagem** (`jornadapet.com.br` + Cloudflare Pages por padrão).
4. **Número de WhatsApp** da empresa, quem responde e o prazo — entra no erro do formulário e nas
   dúvidas se existir.
5. **Frases que prometem algo:** "Sem custo enquanto estivermos testando" e "Somos dois sócios, e
   respondemos pessoalmente quem se inscreve".
6. **Fotos próprias** (profissional trabalhando) no lugar das do placedog.net — sem elas a página
   pode ir ao ar com as atuais **somente** se a licença permitir uso comercial; se não, com
   ilustração neutra.
7. **Papel de cada sócio** (opcional).
8. **Checagem de marca** no INPI e dos @ no Telegram e Instagram (NT-001 §10.3).

Enquanto não houver resposta, a implementação usa valores de configuração (variáveis de ambiente)
e textos marcados com `TODO(sócios)`, e o checklist de publicação do plano não passa.

## 11. Fora de escopo

Mini App, bot e qualquer parte do produto; blog; versão em outro idioma; páginas por perfil;
mascote; testes A/B; analytics; CMS.
