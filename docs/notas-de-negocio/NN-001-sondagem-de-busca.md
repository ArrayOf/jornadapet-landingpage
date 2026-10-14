# NN-001 — Sondagem de busca: marca e mercado

**Data:** 13/10/2026 · **Assunto:** como a JornadaPet aparece (ou não) nas buscas e quem disputa o
espaço · **Relacionadas:** [NT-001](../notas-tecnicas/NT-001-landing-page.md) §15 a §18,
[spec copy v2](../superpowers/specs/2026-10-13-copy-v2-e-indicacao-design.md) §8

## 1. Situação hoje

Ainda não há ranking para avaliar. A página está publicada com o bloqueio de indexação ligado
(`PUBLIC_INDEXAR=false`: `robots.txt` com `Disallow: /` e `noindex, nofollow`), de propósito, até
haver domínio definitivo. Por isso o Google não guarda a página e ela não aparece em nenhuma busca,
nem pelo próprio nome.

Só vai dar para medir posição depois de liberar a indexação e cadastrar o site no **Google Search
Console**, que mostra por quais buscas o site apareceu, em que posição e quantos cliques recebeu.

## 2. Sondagem

Duas buscas para ver o terreno.

> **Ressalva:** a ferramenta usada consulta um buscador dos EUA, não o Google Brasil. Trate como
> indício, não como medição.

### 2.1 "JornadaPet"

Não apareceu nada da marca, só páginas sobre a palavra "jornada", como a
[Jornada del Muerto](https://en.wikipedia.org/wiki/Jornada) no Novo México.

- **Ninguém disputa esse nome hoje.**
- Também não apareceu nada do `jornadapet.com.br`, que é de um terceiro: sugere que ele não tem um
  site ativo e indexado.

### 2.2 "app agenda controle de pagamento para adestrador de cães"

Os resultados são quase todos apps para **tutores** treinarem o próprio cão em casa:

- [Woofz](https://apps.apple.com/BR/app/id1532020050) e
  [PawChamp](https://www.jb.com.br/colunistas/jbicho-e-cia/2025/10/966341-pawchamp-review-2025-do-app-de-adestramento-canino.html).

Aparecem ainda sistemas para creches e banho e tosa, e software em inglês para adestradores:

- [GOAndGO Pet](https://apps.apple.com/us/app/goandgo-pet/id1168891720) (creches e hotéis);
- [Pet House App](https://apps.apple.com/ec/app/pet-house-app/id6468585658) (banho, tosa e passeio);
- [software para adestradores, em inglês](https://ddg.wcroc.umn.edu/software-for-dog-trainers).

**Não apareceu nada em português feito para o adestrador autônomo gerir clientes e pagamentos.**

## 3. Leitura

É um bom sinal para quando a indexação for liberada:

- **Busca pela marca:** quem procurar "JornadaPet" tende a achar a página primeiro, porque não há
  concorrência pelo nome.
- **Busca pelo problema:** em termos como "controle de pagamento adestrador", o espaço parece pouco
  disputado em português. Ainda assim, uma página só de captação dificilmente fica bem colocada
  nessas buscas. Para isso funcionar, é preciso **conteúdo**, por exemplo um guia sobre como o
  adestrador controla pacotes e pagamentos.

## 4. Próximos passos

1. **Decidir o domínio** (`jornadapet.app.br`, que já é do Mário, ou registrar `jornadapet.com`).
   O `jornadapet.com.br` é de terceiro.
2. **Liberar a indexação:** `PUBLIC_SITE_URL` e `PUBLIC_INDEXAR=true` no Build do Cloudflare, com
   301 do `workers.dev` para o domínio preservando `?ref=` e UTMs (checklist na spec copy v2 §8).
3. **Cadastrar no Google Search Console** (e no Bing Webmaster) e enviar o `sitemap-index.xml`.
   Em algumas semanas o Search Console mostra o ranking de verdade.
4. **Criar conteúdo para as buscas pelo problema**, a começar por um guia de controle de pacotes e
   pagamentos para adestrador.
5. **Refazer esta sondagem no Google Brasil** (aba anônima, `google.com.br`) para confirmar os
   achados, e comparar com o Search Console depois de indexar.
