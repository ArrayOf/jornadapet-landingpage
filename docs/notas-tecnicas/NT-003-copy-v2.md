# NT-003 — Copy v2 da landing page

**Data:** 13/10/2026 · **Spec:** [2026-10-13-copy-v2-e-indicacao-design.md](../superpowers/specs/2026-10-13-copy-v2-e-indicacao-design.md) §3 ·
**Antes:** [NT-001](NT-001-landing-page.md)

## 0. Contexto

Com a página no ar e o formulário gravando no Supabase (NT-001 §15 a §18), uma revisão de copy
leu a página inteira do ponto de vista do adestrador autônomo que chega pelo celular. O critério de
prioridade foi o efeito na conversão (pedir o convite), não o gosto.

## 1. Achados, por prioridade

### Prioridade 1 — confunde ou quebra a confiança

| # | Achado | Tratamento |
|---|---|---|
| 1 | Quatro palavras para a mesma ação: "Quero testar", "teste", "convite", "Pedir meu convite" | "convite" para a ação; "teste" só para a fase do produto |
| 2 | "quem ainda falta" no h1 também é o aluno que faltou (a agenda de exemplo usa "Falta") | Novo h1 (opção c) |
| 3 | FAQ promete "os dados não são compartilhados", o que é falso com operadores | "Não vendemos nem usamos para outro fim" |
| 4 | E-mail de contato num domínio de terceiro | Fora desta rodada: depende da decisão do domínio |

### Prioridade 2 — aumenta a conversão

| # | Achado | Tratamento |
|---|---|---|
| 5 | "Meus clientes precisam usar o Telegram? Não." só no FAQ | Vira destaque na Prévia: "Seus tutores não mudam nada" |
| 6 | Jargão: "bot", "carteira recorrente", "repetição toda semana" | Reescrito em linguagem de quem atende cão |
| 7 | Tela de sucesso não pede nada | NT-004 |
| 8 | Sem credibilidade dos sócios | Fora: precisa de números reais |
| 9 | "se o Telegram é o canal certo" no Sobre planta dúvida no meio da venda | Sai do Sobre; continua no FAQ do Telegram, onde responde a uma pergunta |
| 10 | FAQ sem perguntas do público | Entra "Funciona no iPhone e no Android?"; as que dependem de produto ficam fora |

### Prioridade 3 — polimento

| # | Achado | Tratamento |
|---|---|---|
| 11 | "Sem caderno, sem planilha" 2×; "A gente chama você no WhatsApp" 3× | Uma ocorrência de cada |
| 12 | Selo "Em construção" soa a obra inacabada | "Em teste com adestradores" |
| 13 | "Nos próximos dias" é vago | "Em até 3 dias úteis" |
| 14 | Title sem a dor principal (pagamentos) | Title, description e og alinhados à promessa |
| 15 | Sem prova social | Fora: não inventar números |

## 2. O que fica (e por quê)

- "Cliente, sessão e pagamento, num lugar só." e os verbos Cadastre, Agende, Acompanhe: claros e no
  vocabulário do público.
- Os exemplos com nomes, raças e valores (Thor, Marina, R$ 300): mostram o produto sem prometer.
- "Uma empresa pequena, que prefere ouvir antes de vender." e "Primeiro, o básico bem feito.":
  a voz da marca.
- A seção "Em estudo, sem data": honesta sem prometer.
- A microcopy do formulário e a mensagem de erro, que tranquiliza ("Seus dados continuam aqui").

## 3. Título: opções consideradas

| Opção | Texto | Resultado |
|---|---|---|
| a | Adestrador: saiba quem já pagou e quem ainda não pagou. | Descartada: menor mudança, mas só uma dor |
| b | Adestrador: chega de procurar no WhatsApp quem ainda não pagou. | Descartada: dor concreta, mas centrada no problema e não no produto |
| **c** | **Adestrador: seus clientes, sua agenda e quem ainda falta pagar, num lugar só.** | **Escolhida (Thiago):** cobre as três frentes da v1 e fecha com o benefício |

Consequência: com o h1 já listando clientes, agenda e pagamentos, o texto de apoio deixa de repetir
a lista e passa a dizer **onde** (Telegram, celular e computador) e **sem o quê** (caderno, planilha,
app). "num lugar só" também ecoa o título de Como funciona, de propósito.

O h1 fica mais longo (de 50 para 78 caracteres). A regra de até 3 linhas no desktop continua; se não
couber na coluna, o `clamp()` do h1 desce dentro da escala do `DESIGN.md`.

## 4. Botões: opções consideradas

"Quero meu convite" (escolhida), "Pedir convite" (mais curto, mas impessoal) e manter "Quero testar"
(mantém o ruído do achado 1). O botão do formulário segue "Pedir meu convite": o primeiro é o
desejo, o segundo é a ação.

## 5. Selo do hero

"Convites abertos aos poucos" criaria escassez honesta, mas repetiria "Acesso por convite", que está
duas linhas abaixo. "Em teste com adestradores" diz a fase e para quem, sem repetir. Ícone:
`ph:seal-check` (a primeira versão usava o frasco, que é o ícone das ideias "Em estudo", sem data:
ligaria o produto da v1 ao que não existe; ver §7).

## 6. Pendências que destravam o resto

Domínio e e-mail (achado 4), números reais de credibilidade e prova social (8, 15), respostas de
produto para o FAQ (10). Ver spec §7.

## 7. Revisão por especialistas (13/10/2026)

SEO, UX, um segundo copywriter e marketing leram a primeira versão da spec. O que mudou na copy:

| Achado | Quem | Mudança |
|---|---|---|
| h2 do formulário "Teste antes de todo mundo." usa "teste" como ação (escapou da tabela) | UX, copy, SEO | **Peça seu convite.** |
| Title começava pela marca, que ninguém busca, e não tinha "cães" | SEO | **Agenda, clientes e pagamentos para adestrador de cães \| JornadaPet**; og:title encurtado para 55 caracteres |
| Prévia se contradizia: "onde você já conversa" (Telegram) x "a conversa continua no WhatsApp" | copy | Subtítulo novo; "Para o tutor, nada muda." em 1º; sai "No celular e no computador" (repete o hero) e a coluna fica 2 + 2 (UX) |
| "Mande o link para ele" exclui adestradoras; a página usa a Camila como persona | copy | **Conhece mais alguém que adestra?** / **Mande o link para pedir o convite também.** |
| Mensagem de indicação soava como anúncio e não dizia que é grátis | copy, marketing | Na voz do colega, com "É feita para adestrador e não custa nada durante o teste." |
| "Respondemos" supõe pergunta; o prazo prometia também o convite | copy, marketing | **A gente chama você no WhatsApp em até 3 dias úteis.** (só o primeiro contato) |
| "Agende" + "Agenda…" parece erro; o adestrador fala "horário fixo" | copy | Texto novo do passo; "aula" ou "sessão" fica para confirmar com adestradores |
| Para quem: intro e cartão diziam o mesmo; "carteira recorrente" ficou na intro | copy | Intro sem jargão; cartão com informação nova; h2 com "de cães" (SEO) |
| "bot" no rótulo e no aria-label do hero | UX, SEO | "no Telegram" |
| FAQ dos dados: "outro fim" sem complemento e confusão com a política da página | copy | Texto novo |
| A pergunta nova não respondia "é um aplicativo?" | SEO | **Preciso baixar algum aplicativo? Funciona no iPhone e no Android?** |
| h1 de 78 caracteres pode passar de 3 linhas | UX | Medir; primeiro o tipo (2 rem é o mínimo da escala), depois encurtar o texto |

Ficou como estava, por concordância dos quatro: o h1 (opção c), "Quero meu convite" e "Pedir meu
convite", tirar "canal certo" do Sobre, os exemplos com nomes e valores, a microcopy de erro.

