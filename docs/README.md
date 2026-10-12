# Landing page da JornadaPet — documentação

Página pública da JornadaPet: apresenta a empresa e capta profissionais de cuidado e comportamento
animal interessados em participar da construção do produto. Stack: **Astro + Tailwind CSS +
Alpine.js**, com motion design.

O conteúdo vem do repositório do produto, [ArrayOf/jornada-pet](https://github.com/ArrayOf/jornada-pet)
(`discovery/` e `specs/visao-geral/`). O `DESIGN.md` de lá (análise do Pinterest) **não** é a
referência visual desta página: a direção foi reescolhida na NT-001.

## Estrutura

- `notas-tecnicas/NT-00X-*.md` — decisões, com o motivo de cada uma e as direções descartadas.
  - `notas-tecnicas/prototipos/` — protótipos HTML autocontidos (abrem direto do disco).
  - `notas-tecnicas/imagens/NT-00X/` — capturas das direções e dos resultados.
- `superpowers/specs/AAAA-MM-DD-*-design.md` — specs, escritas depois da aprovação do protótipo.
- `superpowers/plans/AAAA-MM-DD-*.md` — planos de implementação de cada spec.

Referências do projeto, fora de `docs/`:

- `../references/awesome-design-md/` — acervo de 73 DESIGN.md de sites reais
  ([VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md), commit em
  `SOURCE_COMMIT`). Consulta; não é skill.
- `../.claude/skills/` — `impeccable`, `design-taste-frontend` e `web-design-guidelines`, instaladas
  com `npx skills add` e travadas em `../skills-lock.json`.

---

## Landing page — 2026-10-11

[`NT-001`](notas-tecnicas/NT-001-landing-page.md) ·
protótipo vigente [`NT-001-landing-page-v2.html`](notas-tecnicas/prototipos/NT-001-landing-page-v2.html) ·
v1 [`NT-001-landing-page.html`](notas-tecnicas/prototipos/NT-001-landing-page.html)

**v2 (11/10):** o produto definiu a
[versão 1](https://github.com/ArrayOf/jornada-pet/tree/main/planejamento/versao-1). Ela traz Conta
por convite, Carteira, Agenda e Financeiro no Telegram. O resumo para o Tutor e o uso por áudio
ficaram para depois. A página passou a contar a história da v1, e o restante aparece numa faixa
"em breve". Detalhes na §0 da nota.

A direção visual foi escolhida em três rodadas de desenhos lado a lado:

- **Estilo:** M2, o "caderno pastel" (base do Notion), com os cartões de vidro inspirados no
  ElevenLabs.
- **Motion:** meio-termo. O fundo é vivo e os cartões são calmos.

Oito seções, de Hero a Rodapé. A captação é feita por formulário enviado a um serviço externo, sem
backend próprio. O protótipo veio **antes** da spec, como no redesenho do webchat. A nota guarda as
direções descartadas e o motivo de cada uma.

```text
┌─────┬──────────────────────────────────────┬───────────┬──────┬───────┬──────────────────────┐
│  #  │                Frente                │ Protótipo │ Spec │ Plano │        Estado        │
├─────┼──────────────────────────────────────┼───────────┼──────┼───────┼──────────────────────┤
│ 1   │ Landing page (9 seções + formulário) │ ✅        │ ✅   │ ✅    │ implementada (branch)│
└─────┴──────────────────────────────────────┴───────────┴──────┴───────┴──────────────────────┘
```

Protótipo: v2 <https://claude.ai/artifact/BrtZ8agaS62DGrbHwVaiem> · v1
<https://claude.ai/artifact/VRU8PiqxEZoqFk3Nm43s7C> · design system em [`../DESIGN.md`](../DESIGN.md) ·
spec [`2026-10-11-landing-page-design.md`](superpowers/specs/2026-10-11-landing-page-design.md) ·
plano [`2026-10-11-landing-page.md`](superpowers/plans/2026-10-11-landing-page.md).

Estado anterior (histórico): aguardando a aprovação do protótipo. Depois vem a spec, que precisa resolver os pontos da
§6 da nota. Os mais importantes:

- o serviço do formulário;
- a hospedagem e o domínio;
- fotos próprias no lugar das do placedog.net;
- nomes dos sócios;
- quatro frases que prometem algo e precisam de confirmação.

---

## Marca — 2026-10-11

[`NT-002`](notas-tecnicas/NT-002-marca.md) ·
folha da marca [`NT-002-marca.html`](notas-tecnicas/prototipos/NT-002-marca.html) ·
arquivos em [`NT-002-assets/`](notas-tecnicas/prototipos/NT-002-assets/) ·
histórico: [exploração](notas-tecnicas/prototipos/NT-002-exploracao.html) e
[esboço](notas-tecnicas/prototipos/NT-002-esboco.html)

A marca é um **mascote**: um vira-lata caramelo sentado, de coleira oliva, com o J da JornadaPet
na plaqueta. Ele substitui o símbolo "J-guia" da NT-001. A escolha saiu de cinco rodadas de
desenhos: J-guia, pata, plaqueta, monograma JP, traço fino e, por fim, o mascote.

A arte de referência foi gerada por IA a partir do esboço e depois limpa e vetorizada com as cores
exatas da paleta. A pasta `NT-002-assets/` tem os SVGs, os PNGs prontos para cada canal (Telegram,
WhatsApp, Instagram, favicon, ícones e imagem de compartilhamento) e as ferramentas que
reproduzem tudo.

```text
┌─────┬──────────────────────────────────────┬───────────┬──────┬───────┬──────────────────────┐
│  #  │                Frente                │ Protótipo │ Spec │ Plano │        Estado        │
├─────┼──────────────────────────────────────┼───────────┼──────┼───────┼──────────────────────┤
│ 2   │ Marca (mascote, selos, arquivos)     │ ✅        │ —    │ —     │ arte de referência   │
└─────┴──────────────────────────────────────┴───────────┴──────┴───────┴──────────────────────┘
```

Pendências na §9 da nota. As principais:

- a origem e os direitos das imagens;
- a arte final por ilustrador;
- a checagem no INPI e dos @;
- levar a marca ao DESIGN.md, ao protótipo e ao plano da landing.
