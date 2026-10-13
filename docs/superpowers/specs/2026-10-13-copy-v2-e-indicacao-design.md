# Design — copy v2 e indicação pós-inscrição

**Data:** 13/10/2026 · **Notas técnicas:** [NT-003](../../notas-tecnicas/NT-003-copy-v2.md) (copy),
[NT-004](../../notas-tecnicas/NT-004-pos-inscricao-indicacao.md) (pós-inscrição) · **Spec anterior:**
[2026-10-11-landing-page-design.md](2026-10-11-landing-page-design.md)

A página está no ar (`jornadapet.arrayof.workers.dev`) e grava pedidos no Supabase. Uma revisão de
copy (13/10) achou ruídos que custam conversão e um momento desperdiçado: a tela de sucesso. Esta
spec cobre as duas frentes. Não muda arquitetura nem identidade visual.

## 1. Problema

1. **Vocabulário do pedido desalinhado.** A mesma ação aparece como "Quero testar", "teste",
   "convite" e "Pedir meu convite". O leitor não sabe se testar e pedir convite são coisas diferentes.
2. **Título com duplo sentido.** "quem ainda falta" também é o aluno que faltou, e a agenda de
   exemplo usa "Falta" nesse sentido.
3. **Promessa falsa no FAQ.** "os dados não são compartilhados" não é verdade com Cloudflare,
   Supabase e Telegram (já foi tirada do aceite em 12/10).
4. **A maior objeção chega tarde.** "Meus clientes precisam usar o Telegram? Não." está só no FAQ.
5. **Jargão de software** ("bot", "carteira recorrente", "repetição toda semana").
6. **Dúvida plantada no meio da venda:** "se o Telegram é o canal certo" no Sobre.
7. **Repetições e prazo vago:** "Sem caderno, sem planilha" duas vezes, "A gente chama você no
   WhatsApp" três vezes, "nos próximos dias".
8. **A tela de sucesso não pede nada.** É o pico de intenção, e a pessoa só lê "vamos chamar você".
   Indicação é o canal mais barato para esse público, que se conhece em grupos e cursos.

## 2. Decisões (Thiago, 13/10/2026)

| # | Decisão |
|---|---|
| D1 | Título do hero: **"Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só."** (opção c) |
| D2 | Botões de chamada (menu, hero, Como funciona, barra do celular): **"Quero meu convite"**. O botão do formulário segue "Pedir meu convite". "Teste" fica só para a fase do produto. |
| D3 | Prazo prometido: **"em até 3 dias úteis"**. |
| D4 | Escopo: copy v2 (NT-003) **e** pós-inscrição com indicação (NT-004). |

Decisões tomadas na escrita da spec (revisáveis):

| # | Decisão | Por quê |
|---|---|---|
| D5 | Selo do hero: **"Em teste com adestradores"** | "Em construção" soa a obra inacabada; "Convites abertos aos poucos" repetiria a linha "Acesso por convite" logo abaixo. |
| D6 | Indicação por **código aleatório** de 8 caracteres, não por nome ou WhatsApp | O link circula em grupos: não pode expor dado pessoal de quem indicou. |
| D7 | "Salve nosso número" só aparece quando houver WhatsApp da empresa | O número ainda não existe (pendência dos sócios); a tela não pode mostrar um campo vazio. |

## 3. Copy v2 (NT-003)

Texto final de cada trecho. Onde não há linha, o texto atual fica.

| Onde | Hoje | Passa a ser |
|---|---|---|
| `<title>` | JornadaPet: agenda e clientes para adestradores de cães | **JornadaPet: agenda, clientes e pagamentos para adestradores** |
| meta description | Organize tutores, pets, sessões e valores a receber do seu trabalho de adestramento no Telegram, sem instalar outro app. Acesso por convite. | **Organize clientes, agenda e quem ainda falta pagar do seu trabalho de adestramento, direto no Telegram, sem instalar outro app. Acesso por convite.** |
| `og:title` | JornadaPet: clientes, agenda e valores a receber do adestrador | **JornadaPet: clientes, agenda e pagamentos do adestrador, num lugar só** |
| `og:description` | Tutores, pets, sessões e valores a receber do adestrador autônomo, organizados no Telegram. Acesso por convite. | **Clientes, agenda e quem ainda falta pagar, organizados no Telegram. Acesso por convite.** |
| Hero, selo | Em construção, ouvindo adestradores | **Em teste com adestradores** (ícone de frasco, `ph:flask`) |
| Hero, h1 | Adestrador: saiba quem já pagou e quem ainda falta. | **Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só.** |
| Hero, apoio | Clientes, sessões e valores a receber organizados no Telegram. Sem caderno, sem planilha, sem instalar outro app. | **Tudo organizado no Telegram, no celular e no computador. Sem caderno, sem planilha, sem instalar outro app.** |
| Botões de chamada (5) | Quero testar | **Quero meu convite** |
| Como funciona, intro | Sem planilha, sem caderno e sem procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar. | **Chega de procurar conversa antiga no WhatsApp para lembrar quem ainda falta pagar.** |
| Passo "Agende" | Sessões por dia ou semana, repetição toda semana e aviso quando dois horários se cruzam. | **Agenda por dia ou semana, sessões que se repetem sozinhas e aviso quando dois horários se cruzam.** |
| Prévia, "Dentro do Telegram" | Abre pelo nosso bot. Não tem outro aplicativo para baixar. | **Abre numa conversa do Telegram, como um contato. Não tem outro aplicativo para baixar.** |
| Prévia, novo destaque (coluna esquerda, 3º) | — | **Seus tutores não mudam nada.** A conversa com eles continua no seu WhatsApp. Só você usa a JornadaPet. (ícone `ph:whatsapp-logo`) |
| Para quem, cartão Adestradores | Autônomos com carteira recorrente. É com vocês que estamos construindo agora. | **Quem atende os mesmos clientes toda semana. É com vocês que estamos construindo agora.** |
| Sobre, "Ainda descobrindo" | Preço, quais profissionais mais precisam disso e se o Telegram é o canal certo. | **Preço e quais profissionais mais precisam disso.** |
| Participe, sob o botão | A gente chama você no WhatsApp. | **Respondemos em até 3 dias úteis.** |
| Sucesso, parágrafo | Vamos chamar você no WhatsApp (x) nos próximos dias. | **Vamos chamar você no WhatsApp (x) em até 3 dias úteis.** |
| `/obrigado` | A gente chama você no WhatsApp nos próximos dias para conversar e enviar o seu convite. | **A gente chama você no WhatsApp em até 3 dias úteis para conversar e enviar o seu convite.** |
| FAQ "E os dados dos meus clientes?" | Cada profissional vê apenas a própria carteira, e os dados não são compartilhados. Estamos escrevendo a política de dados do produto com base na LGPD. | **Cada profissional vê apenas a própria carteira. Não vendemos nem usamos os dados dos seus clientes para outro fim. Estamos escrevendo a política de dados do produto com base na LGPD.** |
| FAQ, nova (depois de "Preciso usar o Telegram?") | — | **Funciona no iPhone e no Android?** Sim. A JornadaPet funciona dentro do Telegram, que tem aplicativo para iPhone, Android e computador. |

**Regras:** sem travessão em texto visível (há teste); "convite" para a ação, "teste" para a fase; o
h1 continua em no máximo 3 linhas no desktop de 1440 px (há teste); se não couber, reduzir o
`clamp()` do h1 dentro da escala do `DESIGN.md`.

## 4. Pós-inscrição e indicação (NT-004)

### 4.1 Tela de sucesso

Abaixo do parágrafo "Vamos chamar você…", na ordem:

1. **Salve nosso número** (só com D7 satisfeita): "Salve nosso número para reconhecer a mensagem:"
   + o número formatado como link `https://wa.me/55<dígitos>`. A fonte é a constante
   `WHATSAPP_EMPRESA` em `src/data/conteudo.ts` (vazia hoje). Vazia ou inválida → o bloco não é
   renderizado.
2. **Indique um colega:** título "Conhece outro adestrador?", texto "Mande o link para ele pedir o
   convite também." e dois botões:
   - **Enviar pelo WhatsApp** → `https://wa.me/?text=<mensagem codificada>`, nova aba.
   - **Copiar link** → `navigator.clipboard.writeText(link)`; o rótulo vira "Link copiado" por 2 s
     (anunciado por `aria-live`). Sem permissão de área de transferência, mostra o link em texto
     selecionável no lugar do botão.
3. **Enviar outro contato** (já existe).

Mensagem: "Pedi meu convite para testar a JornadaPet, que organiza clientes, agenda e quem ainda
falta pagar, direto no Telegram. Peça o seu: <link>".

### 4.2 Código de indicação

- **Formato:** 8 caracteres de `a-z0-9` sem os ambíguos (`0 o 1 l i`), gerados com
  `crypto.getRandomValues`. Regex de validação: `^[a-hjkmnp-z2-9]{8}$`.
- **Estabilidade:** o código fica no `localStorage` (`jp-codigo`); o mesmo navegador reusa o mesmo
  código, inclusive num reenvio do mesmo WhatsApp no mesmo dia (que o banco não grava de novo).
  `localStorage` bloqueado → código novo a cada página, sem quebrar nada.
- **Link:** `<origem da página>/?ref=<código>`, montado no navegador com `location.origin`. Não usa
  `PUBLIC_SITE_URL`: ela ainda não está configurada e o padrão (`jornadapet.com.br`) é domínio de
  terceiro; a origem da página é sempre o endereço que a pessoa está usando. O `ref` já é lido,
  guardado na sessão e enviado pelo formulário (`src/lib/utm.ts`).
- **Envio:** o formulário manda `codigo_indicacao`. O Worker grava só se casar com a regex; senão,
  ignora o campo (não recusa o pedido).
- **Banco:** coluna `codigo_indicacao text` com índice único parcial (`where codigo_indicacao is not
  null`) e a view `indicacoes` (quem indicou, quem chegou, quando), só para os sócios no painel.
  Conflito no índice (código repetido por acaso, chance desprezível) cai no 409 que já vira sucesso.
- **Aviso no Telegram:** quando o `ref` do pedido casar com a regex, a linha da origem passa a ser
  "Indicação: código <ref>".

### 4.3 Privacidade

A política (§ "O que coletamos" e "O que fica no seu navegador") passa a citar o código aleatório de
indicação e o `localStorage` (que não expira ao fechar a aba). Data de atualização: 13/10/2026.

## 5. Ordem de publicação

O Worker novo grava a coluna `codigo_indicacao`. **Rodar `supabase/003_indicacao.sql` antes do push**:
com o Worker novo e a coluna ausente, o Supabase recusa todo pedido (PGRST204).

## 6. Verificação

- Unidade: código (formato, alfabeto, validação), link e mensagem; Worker grava/ignora o código e
  marca a indicação no aviso.
- E2E: textos novos (h1, botões, prazo, FAQ, prévia), h1 em até 3 linhas, tela de sucesso com link
  `?ref=<código>`, WhatsApp de compartilhamento codificado, "Copiar link" com retorno, bloco do
  número ausente com a constante vazia, mesmo código num segundo envio, política citando o código.
- Acessibilidade (axe) e "nenhum travessão" seguem verdes.
- Depois do deploy: um pedido real com `?ref=` de outro pedido aparece na view `indicacoes`.

## 7. Fora de escopo (pendências dos sócios)

Domínio e e-mail de contato (o `jornadapet.com.br` é de terceiro), WhatsApp da empresa, frase de
credibilidade com números reais, prova social, FAQ que depende de decisão de produto (CNPJ/MEI, o que
esperamos no teste, exportar dados), recompensa por indicação.
