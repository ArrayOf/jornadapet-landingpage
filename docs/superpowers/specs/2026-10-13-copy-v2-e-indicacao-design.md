# Design — copy v2 e indicação pós-inscrição

**Data:** 13/10/2026 (revisada no mesmo dia por SEO, UX, copy e marketing) ·
**Notas técnicas:** [NT-003](../../notas-tecnicas/NT-003-copy-v2.md) (copy),
[NT-004](../../notas-tecnicas/NT-004-pos-inscricao-indicacao.md) (pós-inscrição e fila) ·
**Spec anterior:** [2026-10-11-landing-page-design.md](2026-10-11-landing-page-design.md)

A página está no ar (`jornadapet.arrayof.workers.dev`) e grava pedidos no Supabase. Uma revisão de
copy achou ruídos que custam conversão, e a tela de sucesso desperdiça o pico de intenção. Quatro
revisores (SEO, UX, copy, marketing) leram a primeira versão desta spec; o que mudou por causa
deles está marcado com **(rev.)**. Não muda a identidade visual.

## 1. Problema

1. Vocabulário do pedido desalinhado ("Quero testar", "teste", "convite", "Pedir meu convite").
2. Título com duplo sentido ("quem ainda falta" também é o aluno que faltou).
3. Promessa falsa no FAQ ("os dados não são compartilhados").
4. A maior objeção ("meus clientes precisam usar o Telegram?") só aparece no FAQ.
5. Jargão de software ("bot", "carteira recorrente").
6. Dúvida plantada no meio da venda ("se o Telegram é o canal certo").
7. Repetições e prazo vago.
8. A tela de sucesso não pede nada; indicação é o canal mais barato para esse público.
9. **(rev.)** Metadados apontam para o domínio de um terceiro (`jornadapet.com.br`): o preview do
   link no WhatsApp, o canonical, o sitemap e o e-mail do JSON-LD.
10. **(rev.)** A fila de pedidos não tem estado: ninguém mede nem protege a promessa de prazo.

## 2. Decisões

**Do Thiago (13/10/2026):**

| # | Decisão |
|---|---|
| D1 | h1: **"Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só."** |
| D2 | Botões de chamada: **"Quero meu convite"**; o do formulário segue "Pedir meu convite". "Teste" só para a fase do produto. |
| D3 | Prazo: **"em até 3 dias úteis"**, para o **primeiro contato** (rev.: não para o convite). |
| D4 | Escopo: copy v2 e pós-inscrição com indicação. |
| D8 | **(rev.)** Fila com estado e métricas da semana entram nesta rodada. |
| D9 | **(rev.)** Aviso no Telegram com o **nome** de quem indicou; link com **UTMs**. |
| D10 | **(rev.)** Prometer **turmas**: quem se indicou entra na mesma turma. Os sócios convidam em lotes. |
| D11 | **(rev.)** Ligar o **Cloudflare Web Analytics** (sem cookies). |

**Tomadas na escrita (revisáveis):**

| # | Decisão | Por quê |
|---|---|---|
| D5 | Selo do hero: "Em teste com adestradores", ícone `ph:seal-check` (rev.: não o frasco) | O frasco é o ícone das ideias "Em estudo", sem data |
| D6 | Indicação por código aleatório de 8 caracteres | O link circula em grupos; não pode expor dado pessoal |
| D7 | "Salve nosso número" só com WhatsApp da empresa definido | O número ainda não existe |
| D12 | **(rev.)** Um código **por WhatsApp**, escolhido no envio; índice **comum** | Com um código por navegador e índice único, o segundo pedido do mesmo aparelho era recusado e mostrado como sucesso (perda silenciosa) |
| D13 | **(rev.)** Padrão de `PUBLIC_SITE_URL` vira `https://jornadapet.arrayof.workers.dev` | O padrão atual é domínio de terceiro |

## 3. Copy v2 (NT-003)

| Onde | Passa a ser |
|---|---|
| `<title>` (rev.) | **Agenda, clientes e pagamentos para adestrador de cães \| JornadaPet** |
| meta description (rev.) | **Organize clientes, agenda e quem ainda falta pagar no adestramento de cães, direto no Telegram, sem instalar outro app. Acesso por convite.** |
| `og:title` (rev.) | **JornadaPet: clientes, agenda e pagamentos do adestrador** |
| `og:description` | **Clientes, agenda e quem ainda falta pagar, organizados no Telegram. Acesso por convite.** |
| og nas outras páginas (rev.) | `Base.astro` aceita `ogTitle`/`ogDescription`; padrão = `title`/`description` da página |
| Hero, selo | **Em teste com adestradores** (`ph:seal-check`) |
| Hero, h1 | **Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só.** |
| Hero, apoio | **Tudo organizado no Telegram, no celular e no computador. Sem caderno, sem planilha, sem instalar outro app.** |
| Hero, rótulo da nota (rev.) | "bot" → **no Telegram**; aria-label **Exemplo: conversa com a JornadaPet no Telegram, com o botão Abrir JornadaPet** |
| Hero, alt da foto (rev.) | o texto atual, acrescido de **durante o adestramento** se não citar (sem inventar o que a foto não mostra) |
| Botões de chamada (5) | **Quero meu convite** |
| Como funciona, intro | **Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar.** |
| Passo "Agende" (rev.) | **Veja o dia ou a semana, marque uma vez o horário fixo de cada cão e saiba quando dois horários se cruzam.** |
| Prévia, subtítulo (rev.) | **Abra o Telegram e veja o dia inteiro: quem você atende, a que horas e quanto falta receber.** |
| Prévia, coluna esquerda (rev.) | 1º **Para o tutor, nada muda.** A conversa continua no seu WhatsApp. Só você usa a JornadaPet. (`ph:users-three`) · 2º **Dentro do Telegram.** Fica na sua lista de conversas, como um contato. Não tem outro aplicativo para baixar. · sai "No celular e no computador" (repete o hero) |
| Para quem, h2 (rev.) | **Feito primeiro para adestradores de cães.** |
| Para quem, intro (rev.) | **Estamos começando por quem trabalha sozinho e atende os mesmos cães toda semana. Passeador, creche ou banho e tosa? Fale com a gente também.** |
| Para quem, cartão (rev.) | **Aula em casa ou no parque, com horário fixo. É com vocês que estamos construindo agora.** |
| Sobre, bloco 1 (rev.) | título **Em teste**, texto **Clientes, agenda e quem ainda falta pagar, dentro do Telegram.** |
| Sobre, "Ainda descobrindo" | **Preço e quais profissionais mais precisam disso.** |
| Participe, h2 (rev.) | **Peça seu convite.** |
| Participe, parágrafo (rev.) | **O acesso é por convite. Deixe seu contato: a gente conversa sobre a sua rotina e, quando abrir a sua turma, envia o seu convite.** |
| Participe, sob o botão (rev.) | **A gente chama você no WhatsApp em até 3 dias úteis.** |
| `/obrigado` (rev.) | **A gente chama você no WhatsApp em até 3 dias úteis para conversar. Os convites saem aos poucos, em turmas.** |
| FAQ dados (rev.) | **Cada profissional vê apenas a própria carteira. Os dados dos seus clientes servem só para a JornadaPet funcionar para você, e nunca são vendidos. A política do produto, com base na LGPD, está sendo escrita; a política de privacidade desta página já está no rodapé.** |
| FAQ nova (rev.) | **Preciso baixar algum aplicativo? Funciona no iPhone e no Android?** Só o Telegram, que tem aplicativo para iPhone, Android e computador. A JornadaPet abre dentro dele, como um contato. Não tem outro aplicativo para baixar. |

**Regras:** sem travessão; "convite" para a ação; h1 em até 3 linhas no desktop (1024, 1280 e
1440 px) e o botão do hero visível em 360×640. Se o h1 passar de 3 linhas, primeiro baixar o tipo
para `clamp(2rem,3.6vw,2.75rem)` (2 rem é o mínimo de headline do `DESIGN.md`); se ainda passar,
encurtar para "…e quem falta pagar, num lugar só." **(rev.)**

## 4. Pós-inscrição e indicação (NT-004)

### 4.1 Tela de sucesso

Ordem, de cima para baixo:

1. Ícone e **"Recebemos, {nome}!"** (recebe o foco, como hoje).
2. **"Vamos chamar você no WhatsApp {número} em até 3 dias úteis para conversar."**
3. **Salve nosso número** (só com `WHATSAPP_EMPRESA` válido): "Salve nosso número para reconhecer a
   mensagem: {número com link wa.me}".
4. **Cartão de indicação**, neutro (`bg-surface`, borda `line`) **(rev.: não sálvia)**:
   - título **"Conhece mais alguém que adestra?"** **(rev.)**
   - texto **"Mande o link para pedir o convite também."** **(rev.)**
   - **"Os convites saem aos poucos, em turmas. Se o seu colega também pedir, vocês entram na mesma
     turma."** **(rev., D10)**
   - botões **empilhados** no celular e lado a lado a partir de `sm` (rev.), `min-h-11`, 16 px:
     **Enviar pelo WhatsApp** (principal) e **Copiar link** (secundário, borda `ink/25`).
5. **"Errou algum dado? Enviar de novo"** **(rev.: substitui "Enviar outro contato")**, `min-h-11`;
   volta ao formulário com os dados e leva o foco para o campo nome.

**Comportamento (rev.):**

- O contêiner deixa de ser `role="status"` (o foco no título já anuncia). Uma única região
  `sr-only aria-live="polite"`, fora dos botões, anuncia "Link copiado." ou "Não deu para copiar.
  O link está no campo abaixo."
- **Copiar:** `navigator.clipboard.writeText`; se falhar, `document.execCommand('copy')` num campo
  temporário; se falhar, aparece um `<input readonly>` rotulado **"Seu link"**, com a ajuda **"Não
  deu para copiar sozinho. Toque e segure o link para copiar."**, que recebe o foco já selecionado.
  O rótulo do botão é fixo; ao copiar, só o ícone vira `ph:check` por 2 s.
- **Enviar pelo WhatsApp:** `https://wa.me/?text=<mensagem>`; `target="_blank"` só com ponteiro
  fino (desktop); no toque abre na mesma aba (o `wa.me` entrega ao app). Texto `sr-only` "(abre o
  WhatsApp)".
- A barra fixa "Quero meu convite" do celular some depois do pedido.

**Mensagem (rev.):** "Pedi convite para testar a JornadaPet: organiza clientes, agenda e quem ainda
falta pagar, tudo pelo Telegram. É feita para adestrador e não custa nada durante o teste. Pede o
seu aqui: {link}"

### 4.2 Código e link

- **Formato:** 8 caracteres de `a-z` e `2-9` sem `0 o 1 l i`; regex `^[a-hjkmnp-z2-9]{8}$`;
  `crypto.getRandomValues`.
- **Um código por WhatsApp (rev., D12):** `localStorage` `jp-codigos` guarda `{ dígitos: código }`.
  O código é escolhido **no envio**, pelo WhatsApp digitado: o mesmo WhatsApp reusa o seu, outro
  WhatsApp ganha um novo. Storage bloqueado → código novo, sem quebrar.
- **Link (rev., D9):** `<location.origin>/?ref=<código>&utm_source=indicacao&utm_medium=whatsapp` no
  botão do WhatsApp e `…&utm_medium=link` no "Copiar link". Usa `location.origin`, nunca o
  `PUBLIC_SITE_URL`.
- **Envio:** o formulário manda `codigo_indicacao`; o Worker grava só se casar com a regex.

### 4.3 Worker

- **409 (rev., D12):** só vira sucesso quando o conflito é do índice `convites_whatsapp_por_dia`
  (o nome aparece na resposta do PostgREST). Qualquer outro conflito é erro (502), não sucesso.
- **Aviso no Telegram (rev., D9):** quando o `ref` casar com a regex, depois da resposta, o Worker
  busca `nome` e `cidade` de quem tem aquele `codigo_indicacao` e escreve **"Indicação de Camila
  (Campinas, SP)"**. Sem resultado ou com erro, **"Indicação: código {ref}"**.

### 4.4 Banco (`supabase/003_indicacao_e_fila.sql`)

- `codigo_indicacao text` com `check` da regex e **índice comum** (não único).
- **Fila (D8):** `status text not null default 'novo'` com `check (status in ('novo','chamado',
  'convidado','ativo','desistiu'))`, `chamado_em timestamptz`, `convidado_em timestamptz`,
  `nota text`. Editados à mão no Table Editor.
- `grant select (nome, cidade, codigo_indicacao) on public.convites to service_role` (para o aviso).
- Views, todas `security_invoker` e sem acesso para `anon` e `authenticated`:
  - `indicacoes`: quem indicou, quem chegou, quando;
  - `atrasados`: `status = 'novo'` há mais de 3 dias úteis;
  - `semana_por_origem`: pedidos dos últimos 7 dias por origem (`indicação` quando o `ref` é um
    código, senão `utm_source`, senão `direto`) e por perfil.

## 5. Domínio de terceiro e medição (rev.)

- `astro.config.mjs`: padrão de `site` = `https://jornadapet.arrayof.workers.dev` (D13).
- `jsonld.ts`: tirar `email` do `Organization` até haver domínio próprio.
- **Web Analytics (D11):** constante `CLOUDFLARE_ANALYTICS_TOKEN` (pública) em
  `src/data/conteudo.ts`; vazia → sem script. Com token, o `Base.astro` carrega
  `https://static.cloudflareinsights.com/beacon.min.js` com `data-cf-beacon`. A política cita a
  medição sem cookies.
- **Política:** cita o código de indicação, o `localStorage` e o Web Analytics; data 13/10/2026.

## 6. Ordem de publicação

1. Rodar `supabase/003_indicacao_e_fila.sql` **antes** do push (sem a coluna, o Worker novo
   recusaria todo pedido com PGRST204).
2. Criar o site no Cloudflare Web Analytics e pôr o token na constante (pode ser depois do push;
   vazio, nada muda).
3. Push; conferir o preview do link `?ref=` mandando-o para si mesmo no WhatsApp (título, descrição,
   imagem).

## 7. Verificação

- Unidade: código (formato, alfabeto, um por WhatsApp), links com UTMs, mensagem; Worker grava o
  código, trata 409 pelo nome do índice, avisa com o nome de quem indicou e cai no código sem ele.
- E2E: textos novos; h1 em até 3 linhas em 1024/1280/1440; CTA do hero em 360×640; tela de
  sucesso (link, WhatsApp, cópia com e sem permissão, foco no campo do link, anúncio único); dois
  envios no mesmo navegador com WhatsApps diferentes geram códigos diferentes; mesmo WhatsApp reusa;
  "Enviar de novo" leva o foco ao nome; barra fixa some depois do pedido; FAQPage com 8 perguntas;
  og/canonical no `workers.dev`; JSON-LD sem e-mail; política nova.
- Axe nos dois temas e "nenhum travessão" seguem verdes.
- Aparelho real (checklist): Android Chrome, iOS Safari e os navegadores internos do Instagram e do
  WhatsApp, para "Enviar pelo WhatsApp" e "Copiar link".

## 8. Para depois (registrado agora)

- **Troca de domínio:** 301 de `jornadapet.arrayof.workers.dev/*` para o domínio final
  **preservando a query** (`?ref`, `utm_*`); senão as indicações já enviadas perdem a atribuição.
- **Antes de `PUBLIC_INDEXAR=true`:** domínio decidido e `PUBLIC_SITE_URL` de Build nele; canonical,
  og, sitemap e JSON-LD conferidos no HTML publicado; 301 funcionando; e-mail no domínio próprio
  (e volta ao JSON-LD); Search Console e Bing com o `sitemap-index.xml`; `/obrigado`,
  `/nao-enviado` e 404 seguem `noindex`.
- **Pendências dos sócios:** domínio e e-mail, WhatsApp da empresa, frase de credibilidade com
  números reais, prova social, FAQ de produto (CNPJ/MEI, o que esperamos no teste, exportar dados),
  confirmar "aula" ou "sessão" com 2 ou 3 adestradores, e decidir se o Financeiro (a promessa do h1)
  fica no plano pago antes de escalar a indicação.
- **Depois:** contador de cliques nos botões de indicação, regra de prioridade para quem indica,
  página de conteúdo para buscas de cauda longa.
