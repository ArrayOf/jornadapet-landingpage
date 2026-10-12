---
name: JornadaPet
description: Clientes, agenda e valores a receber do adestrador, organizados no Telegram.
colors:
  # Tema claro (paleta E: oliva do uniforme + caramelo do vira-lata, sobre o cinza do estúdio)
  oliva: "#3f5a2c"
  on-oliva: "#ffffff"
  caramelo: "#dba05a"
  orelha: "#c7853f"
  creme: "#f6e3c4"
  lingua: "#e98a9a"
  estudio: "#f4f4f6"
  superficie: "#ffffff"
  tinta: "#23251f"
  corpo: "#45473f"
  apagado: "#676a60"
  linha: "#e2e2e6"
  salvia-clientes: "#e1e7d6"
  lavanda-agenda: "#e0e0ea"
  caramelo-a-receber: "#f2e2cf"
  terracota-falta: "#efdcd2"
  lilas-estudo: "#e7e4ec"
  perigo: "#b42318"
  blob-caramelo: "#ecd2b2"
  blob-salvia: "#cdd6bd"
  blob-lavanda: "#dcdce6"
  # Tema escuro
  escuro-fundo: "#151613"
  escuro-superficie: "#1d1f1a"
  escuro-tinta: "#f1f2ec"
  escuro-corpo: "#cfd1c7"
  escuro-apagado: "#a0a395"
  escuro-linha: "#2e3128"
  escuro-oliva: "#a3c47f"
  escuro-on-oliva: "#17200f"
  escuro-salvia: "#283222"
  escuro-lavanda: "#282a33"
  escuro-a-receber: "#3a2e20"
  escuro-falta: "#3a2823"
  escuro-estudo: "#2d2a33"
  escuro-perigo: "#ff8a80"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 4.4vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  title-lg:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
  lead:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  controle: "12px"
  cartao: "16px"
  pilula: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  secao: "80px"
  secao-larga: "112px"
components:
  botao-principal:
    backgroundColor: "{colors.oliva}"
    textColor: "{colors.on-oliva}"
    typography: "{typography.label}"
    rounded: "{rounded.controle}"
    padding: "14px 20px"
  botao-principal-escuro:
    backgroundColor: "{colors.escuro-oliva}"
    textColor: "{colors.escuro-on-oliva}"
    rounded: "{rounded.controle}"
  link-secundario:
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
  selo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "4px 12px"
  chip-opcao:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.corpo}"
    rounded: "{rounded.pilula}"
    height: "44px"
    padding: "0 16px"
  chip-opcao-marcado:
    backgroundColor: "{colors.oliva}"
    textColor: "{colors.on-oliva}"
    rounded: "{rounded.pilula}"
  campo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.controle}"
    padding: "12px 16px"
  cartao:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.cartao}"
    padding: "24px"
  estado-clientes:
    backgroundColor: "{colors.salvia-clientes}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
  estado-agenda:
    backgroundColor: "{colors.lavanda-agenda}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
  estado-a-receber:
    backgroundColor: "{colors.caramelo-a-receber}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
  estado-falta:
    backgroundColor: "{colors.terracota-falta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
  estado-em-estudo:
    backgroundColor: "{colors.lilas-estudo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pilula}"
  simbolo:
    backgroundColor: "{colors.salvia-clientes}"
    rounded: "{rounded.controle}"
    size: "32px"
---

# Design System: JornadaPet

> Referência canônica de UI da landing page. A história das decisões, as direções descartadas e as
> revisões estão em [`docs/notas-tecnicas/NT-001-landing-page.md`](docs/notas-tecnicas/NT-001-landing-page.md).
> O protótipo que materializa este sistema é
> [`NT-001-landing-page-v2.html`](docs/notas-tecnicas/prototipos/NT-001-landing-page-v2.html).
> Este arquivo **substitui**, para a landing, o `DESIGN.md` do repositório do produto (análise do
> Pinterest), que não foi adotado.

## Overview

**Creative North Star: "O caderno do adestrador, no celular que ele já usa"**

A JornadaPet é ferramenta de trabalho para quem adestra sozinho. A página fala como colega de
ofício: frases curtas, valores e horários concretos, nada de "plataforma" ou "solução". A base é
clara e calma, um cinza-lavanda neutro de estúdio, sobre o qual as cores do ofício aparecem nos
detalhes. O **oliva** vem do colete do adestrador e é a única cor de ação. O **caramelo** vem do
vira-lata e marca o que é dinheiro a receber.

Profundidade vem de cartões de vidro fosco sobre manchas de cor desfocadas que derivam devagar
("blobs"). O vidro só aparece onde existe algo atrás para ser visto. O motion é "meio-termo":
uma entrada em cascata, um passo a passo que conta a história (cadastre, agende, acompanhe) e
reações ao toque. Nada pisca nem chama atenção sem motivo.

A página é honesta sobre a fase do produto: o que existe na versão 1 aparece como fato; o que é
estudo aparece marcado em lilás, "em estudo, sem data".

**Key Characteristics:**
- Fundo neutro `#f4f4f6`, oliva `#3f5a2c` como única cor de ação, caramelo só como destaque.
- Pastéis terrosos **com significado fixo** (clientes, agenda, a receber, falta, em estudo).
- Títulos em Bricolage Grotesque, texto em Instrument Sans, escala curta de seis tamanhos.
- Vidro fosco + blobs + motion suave, tudo desligado com "reduzir movimento/transparência".
- Claro e escuro desde o início.

## Colors

Uma paleta terrosa, tirada do uniforme do adestrador (colete oliva, calça cáqui) e do pelo do
vira-lata caramelo, sobre o cinza-lavanda neutro de um estúdio.

### Primary
- **Oliva do colete** (`#3f5a2c`; escuro `#a3c47f`): botões principais ("Quero testar", "Pedir meu
  convite"), links em hover, ícones de destaque, estado "Concluído", chip de opção marcado, traço
  do símbolo, foco do teclado. Texto sobre ele: branco (7,7:1); no escuro, `#17200f` (8,6:1).

### Secondary: cores de ilustração do mascote (NT-002)
- **Caramelo** (`#dba05a`): pelo do mascote; destaques de dinheiro. **Nunca** em texto ou botão.
- **Orelha** (`#c7853f`), **Creme** (`#f6e3c4`), **Língua** (`#e98a9a`): só dentro da ilustração.
- As mesmas nos dois temas: a marca não muda de cor no escuro.

### Tertiary: estados com significado
- **Sálvia, clientes** (`#e1e7d6`): ficha do pet "Ativo", fundo do símbolo, passo "Cadastre".
- **Lavanda, agenda** (`#e0e0ea`): sessão "Agendado", passo "Agende".
- **Caramelo claro, a receber** (`#f2e2cf`): "Falta receber", passo "Acompanhe", avisos de atenção.
- **Terracota clara, falta** (`#efdcd2`): estado "Falta".
- **Lilás, em estudo** (`#e7e4ec`): selo "Em estudo, sem data" e o bloco de estudo do Sobre.

### Neutral
- **Estúdio** (`#f4f4f6`; escuro `#151613`): fundo da página.
- **Superfície** (`#ffffff`; escuro `#1d1f1a`): seções alternadas, campos, cartões, rodapé.
- **Tinta** (`#23251f`; escuro `#f1f2ec`): títulos e texto forte. 14,1:1 sobre o fundo.
- **Corpo** (`#45473f`; escuro `#cfd1c7`): parágrafos. 8,6:1.
- **Apagado** (`#676a60`; escuro `#a0a395`): legendas, texto de apoio. 5,0:1 (mínimo do sistema).
- **Linha** (`#e2e2e6`; escuro `#2e3128`): bordas de 1px e divisórias.
- **Perigo** (`#b42318`; escuro `#ff8a80`): erros de formulário.

### Named Rules
**A Regra da Voz Única.** O oliva é a única cor que significa "aja aqui". Nenhuma outra cor vira
botão, link ou estado ativo.

**A Regra da Cor que Ensina.** Cada pastel tem um significado e só aparece com ele. O que não é
área do produto (perfis, benefícios, selos genéricos) fica neutro: superfície com linha de 1px.

**A Regra do Caramelo Mudo.** Caramelo (e orelha, creme, língua) nunca carrega texto. Ele é cor de ilustração e de fundo de
"a receber", com texto em tinta por cima (11,6:1).

## Typography

**Display Font:** Bricolage Grotesque (fallback `ui-sans-serif, system-ui`)
**Body Font:** Instrument Sans (fallback `ui-sans-serif, system-ui`)

**Character:** a Bricolage dá voz amigável e com personalidade aos títulos, com espaçamento
apertado; a Instrument é limpa e lê bem em celular. Inter e Geist foram descartadas por serem
batidas.

### Hierarchy
- **Display** (700, `clamp(2.3rem, 4.4vw, 3.6rem)`, 1.04, `-0.025em`): só o título do hero. No
  máximo 3 linhas no desktop.
- **Headline** (700, `clamp(2rem, 4vw, 3rem)`, 1.05): títulos de seção. Uma frase curta.
- **Title large** (700, 28px): título do destaque "Adestradores" no Para quem e do sucesso do formulário.
- **Title** (600, 20px): títulos de cartões e de exemplos.
- **Lead** (400, 18px, 1.625, máx. 46-54ch): subtítulos de seção e do hero.
- **Body** (400, 16px, 1.625, máx. 60ch): texto corrido, respostas do FAQ.
- **Label** (600, 14px): rótulos de campo, botões, selos.
- **Caption** (500, 12px): metadados dentro dos exemplos de interface.

A escala é **12, 14, 16, 18, 20, 28 px** mais os dois `clamp()`. Não introduza tamanhos
intermediários.

### Named Rules
**A Regra Sem Travessão.** Nenhum texto visível usa travessão (—) ou meia-risca (–). Use ponto,
vírgula, dois-pontos ou parênteses.

**A Regra do Ofício.** Texto público fala "clientes", "quem já pagou", "valor a receber",
"sessão", "tutor" e "pet" (minúsculas no texto corrido). Evite "cobrança", "plataforma",
"solução", "gestão", "dashboard" e "IA" em destaque.

## Layout

- **Container:** `max-width: 1152px` (Tailwind `max-w-6xl`), margens laterais de 16px no celular e
  24px a partir de 640px.
- **Ritmo vertical:** seções com 80px de respiro no celular e 96-112px no desktop. Fundo alternado
  entre estúdio e superfície.
- **Hero:** duas colunas `1.25fr / 1fr` no desktop (texto à esquerda, imagem com notas de vidro à
  direita); empilha no celular. Título, subtítulo, botões e uma linha de apoio; nada além disso.
- **Composições:** cada seção usa uma família de layout diferente (passo a passo com palco,
  celular com destaques laterais, bento, faixa com dois cartões, declaração + três blocos,
  formulário dividido, título fixo + acordeão).
- **Celular (< 768px):** tudo em uma coluna, alvos de toque de 44px, botão fixo "Quero testar" na
  base enquanto o botão do hero e o formulário estão fora da tela.

## Elevation & Depth

Profundidade por **vidro fosco** e **sombra quente e difusa**, nunca por sombra dura.

### Shadow Vocabulary
- **Vidro** (`background: rgba(255,255,255,.58); backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255,255,255,.85); box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 18px
  40px -22px rgba(64,48,32,.35)`): cartões flutuantes sobre blobs (notas do hero, palco do passo a
  passo, formulário, faixa "em estudo"). No escuro: `rgba(32,32,36,.55)`, borda `rgba(255,255,255,.10)`.
- **Botão em hover** (`0 12px 24px -12px` na cor do botão a 70%): só como resposta ao ponteiro.
- **Celular de exemplo** (`0 30px 60px -30px rgba(24,24,27,.5)`).

### Named Rules
**A Regra do Vidro com Motivo.** Vidro só sobre algo para ver através (foto ou blob). Com
`prefers-reduced-transparency`, vira superfície sólida com linha.

**A Regra do Movimento Calmo.** Easing `cubic-bezier(.16,1,.3,1)`. Entradas de 0,6-1s; blobs
derivam em 16-23s; notas flutuam 5px em 7s; o passo a passo troca a cada 6s só no desktop e pausa
com ponteiro ou foco. Com `prefers-reduced-motion`, nada anima. O conteúdo é visível por padrão:
a animação de revelação só é aplicada depois que o observador de scroll estiver ativo.

## Shapes

Três raios e nenhum outro: **12px** para controles (botões, campos, itens de lista), **16px** para
cartões e superfícies, **pílula** para selos, chips de opção e estados. Bordas de 1px na cor
"linha". O celular de exemplo usa 44px/36px como exceção figurativa.

O **símbolo** é a cabeça do mascote da [NT-002](docs/notas-tecnicas/NT-002-marca.md): um
vira-lata caramelo de coleira oliva com a plaqueta do J, sobre sálvia. Na página, quadrado de 12px
de raio (menu, rodapé) ou círculo (avatar do bot). Vem de `NT-002-assets/png/icon-512.png`,
reduzido pelo Astro; o SVG vetorizado (cerca de 170 KB) não vai inline na página. Favicons de
16 e 32px também são a cabeça. O **selo redondo** (traço oliva; versão oliva com traço creme no
tema escuro) é o logotipo do topo e do rodapé, com 42px ao lado do nome, num topo de 64px; fora do topo vai só de
96px para cima: ícone iOS, ícones do manifest, imagem de compartilhamento e o selo de 128px no Sobre. O
"J-guia" da NT-001 foi descartado.

## Components

### Buttons
- **Shape:** 12px.
- **Principal:** fundo oliva, texto branco, 14px/600, `14px 20px`. Rótulos: "Quero testar" (menu,
  hero, faixas, barra fixa) e "Pedir meu convite" (formulário). Nenhum outro rótulo de ação.
- **Hover / Active:** sobe 2px com sombra na cor do botão; no clique, `scale(.98)`. A seta
  desliza 3px.
- **Secundário:** link sublinhado ("Ver como funciona"), sublinhado na cor "linha" que vira oliva
  no hover.

### Chips
- **Selo:** pílula, superfície + linha, 14px/500, com ícone Phosphor. Lilás só quando é "em estudo".
- **Estados:** pílula 12px com o pastel do significado e texto em tinta; "Concluído" em oliva.
- **Opção do formulário:** pílula de 44px; marcado = fundo oliva e texto branco.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** superfície, ou pastel quando o cartão **é** um estado; vidro quando flutua.
- **Shadow Strategy:** ver Elevation; cartões comuns não têm sombra.
- **Border:** 1px linha nos neutros.
- **Internal Padding:** 20-24px.

### Inputs / Fields
- **Style:** superfície, linha de 1px, 12px de raio, 16px de texto (evita zoom no iOS).
- **Rótulo acima**, ajuda abaixo em "apagado", erro abaixo em "perigo", ligado por
  `aria-describedby` e `aria-live="polite"`.
- **Focus:** borda oliva + anel de 3px do oliva a 22%.
- **Error:** borda "perigo" e `aria-invalid`.

### Navigation
- 64px de altura, fixa; transparente no topo e com fundo translúcido + linha ao rolar.
- Desktop: marca, quatro links (14px/500), botão "Quero testar". Celular: marca + menu em tela
  cheia (Esc fecha).

### Passo a passo (componente-assinatura)
Três abas (Cadastre, Agende, Acompanhe) com barra de progresso de 6s e um palco com blobs onde um
cartão de vidro troca de conteúdo (ficha do pet, agenda do dia, valor a receber) com
desfoque e deslocamento. Teclado por setas, botão de pausar, painéis inativos com `inert`.

### Conversa do bot (componente-assinatura)
Cartão de vidro com cabeçalho do bot (símbolo em círculo sálvia), a mensagem `/start` em oliva e a
resposta com o botão "Abrir JornadaPet". Mostra só o que a versão 1 faz.

## Do's and Don'ts

### Do:
- **Do** use oliva `#3f5a2c` como a única cor de ação, com texto branco.
- **Do** dê a cada pastel um único significado (clientes, agenda, a receber, falta, em estudo).
- **Do** mantenha três raios (12, 16, pílula) e a escala de seis tamanhos.
- **Do** escreva valores, horários e nomes concretos nos exemplos ("R$ 100", "16h", "Thor").
- **Do** marque como "em estudo, sem data" tudo o que não está na versão 1.
- **Do** desenhe claro e escuro juntos e confira contraste AA em ambos.
- **Do** respeite `prefers-reduced-motion` e `prefers-reduced-transparency`.

### Don't:
- **Don't** use caramelo em texto ou botão.
- **Don't** use azul como cor da marca (some dentro do Telegram).
- **Don't** use a pata de biblioteca de ícones nem o antigo J-guia como símbolo; o símbolo é o mascote da NT-002.
- **Don't** use travessão em texto visível.
- **Don't** prometa preço, cobrança automática, IA ou resumo para o tutor como coisa pronta.
- **Don't** use emoji como ícone; ícones são Phosphor, em peso regular (preenchido só para estado).
- **Don't** crie três cartões iguais em fila como estrutura de seção.
- **Don't** use foto de cão de banco de imagem como identidade; a meta é foto do profissional
  trabalhando (as atuais são provisórias).
