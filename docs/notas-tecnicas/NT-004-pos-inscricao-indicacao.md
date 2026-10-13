# NT-004 — Pós-inscrição, indicação e fila

**Data:** 13/10/2026 · **Spec:** [2026-10-13-copy-v2-e-indicacao-design.md](../superpowers/specs/2026-10-13-copy-v2-e-indicacao-design.md) §4 a §6 ·
**Antes:** [NT-001](NT-001-landing-page.md) §15 a §18

## 0. Por quê

Quem acabou de pedir o convite está no pico de intenção, e a tela de sucesso só diz "vamos chamar
você". Adestradores se conhecem em cursos, grupos de WhatsApp e eventos: a indicação de um colega
é o canal mais barato e mais confiável para esse público. A tela passa a pedir uma coisa só: mandar
o link para outro adestrador. E a fila de pedidos, que hoje só recebe linhas, passa a ter estado,
para os sócios cumprirem e medirem o prazo prometido.

## 1. Tela de sucesso

```text
┌───────────────────────────────────────────────┐
│  ✓  Recebemos, Camila!                         │  ← recebe o foco
│     Vamos chamar você no WhatsApp              │
│     (19) 99876-1234 em até 3 dias úteis        │
│     para conversar.                            │
│                                                │
│     Salve nosso número para reconhecer a       │  ← só com WHATSAPP_EMPRESA
│     mensagem: (11) 9xxxx-xxxx                  │
│                                                │
│  ┌──────────────────────────────────────────┐  │  ← bg-surface, borda line
│  │ Conhece mais alguém que adestra?         │  │
│  │ Mande o link para pedir o convite também.│  │
│  │ Os convites saem aos poucos, em turmas.  │  │
│  │ Se o seu colega também pedir, vocês      │  │
│  │ entram na mesma turma.                   │  │
│  │ [   Enviar pelo WhatsApp   ]             │  │  ← empilhados no celular
│  │ [   Copiar link            ]             │  │
│  └──────────────────────────────────────────┘  │
│     Errou algum dado? Enviar de novo           │
└───────────────────────────────────────────────┘
```

- **Enviar pelo WhatsApp** é o botão principal (oliva): é onde esse público conversa.
- **Copiar link** é secundário (borda `ink/25`, visível sobre a superfície nos dois temas).
- **O cartão é neutro.** A primeira versão usava o sálvia, mas pelo `DESIGN.md` o sálvia significa
  "clientes", e a borda do botão secundário sumia nele (contraste perto de 1:1).
- **"Errou algum dado? Enviar de novo"** substitui "Enviar outro contato". Logo abaixo de "indique um
  colega", o rótulo antigo convidava a preencher o formulário com os dados do colega, o que marca o
  aceite em nome de outra pessoa (LGPD) e, na primeira versão, perdia o pedido (ver §2).
- **Turmas (decisão do Thiago):** os sócios convidam em lotes e põem na mesma turma quem se indicou.
  É uma vantagem honesta, sem recompensa que ainda não existe.

### Acessibilidade e celular

- O contêiner deixa de ser `role="status"`: o foco no título já anuncia o sucesso, e o `status`
  repetia cada mudança dentro dele. Uma única região `sr-only aria-live="polite"` anuncia a cópia.
- O rótulo "Copiar link" não muda (trocar o nome de um botão focado confunde o leitor de tela); só o
  ícone vira um visto por 2 s.
- **Cópia em três degraus:** `navigator.clipboard`, depois `document.execCommand('copy')`, e por
  último um campo "Seu link" já selecionado, com o foco nele e a ajuda "Toque e segure o link para
  copiar". Os navegadores internos do Instagram e do WhatsApp, de onde esse público chega, costumam
  negar a área de transferência.
- `wa.me` com `target="_blank"` só com ponteiro fino: no celular, a mesma aba entrega ao app sem
  deixar uma aba vazia para trás.
- A barra fixa "Quero meu convite" some depois do pedido.

## 2. Como a indicação é rastreada

```text
navegador da Camila                    Worker                       Supabase
  WhatsApp 19998761234 → código "k7m2pq9x"  (localStorage jp-codigos)
  pedido ── codigo_indicacao ─────────▶ valida regex ─────────────▶ convites.codigo_indicacao
  link /?ref=k7m2pq9x&utm_source=indicacao&utm_medium=whatsapp ──▶ colega
navegador do colega
  ?ref=… e utm_* (sessionStorage)
  pedido ── ref, utm_* ───────────────▶ grava ────────────────────▶ convites.ref, utm_*
                                        depois da resposta:
                                        busca nome e cidade do código ◀── select
                                        aviso: "Indicação de Camila (Campinas, SP)"
```

### O erro que a revisão achou

A primeira versão tinha **um código por navegador** e **índice único** no código. Quando alguém
usava "Enviar outro contato" para inscrever um colega no mesmo celular, o segundo pedido saía com o
mesmo código, o índice recusava, e o Worker, que tratava todo 409 como "mesmo WhatsApp no dia",
mostrava "Recebemos" sem gravar nada e sem avisar. UX, copy e marketing acharam o mesmo problema.

**Correção:** um código **por WhatsApp** (mapa `{ dígitos: código }` no `localStorage`), escolhido
no envio; índice **comum**; e o 409 só vira sucesso quando a resposta do PostgREST cita o índice
`convites_whatsapp_por_dia`.

### Opções consideradas

| Opção | Resultado |
|---|---|
| `ref` com o nome ou o WhatsApp de quem indicou | **Descartada:** o link circula em grupos e exporia dado pessoal |
| Código gerado pelo servidor e devolvido na resposta | **Descartada:** o insert usa `return=minimal`, e o reenvio do mesmo dia (409) não grava |
| Código por navegador, índice único | **Descartada na revisão:** perdia o segundo pedido do mesmo aparelho |
| **Código aleatório por WhatsApp, gerado no navegador, índice comum** | **Escolhida** |

**Limite aceito:** quem reenviar no mesmo dia por **outro** navegador ganha um código que não é
gravado (o banco recusa o segundo pedido do dia), e indicações por esse link chegam como "Indicação:
código …", sem nome. Raro, e nenhum pedido se perde.

### UTMs no link

`utm_source=indicacao` separa a indicação de qualquer outro `ref` de campanha, e `utm_medium`
(`whatsapp` ou `link`) diz por onde o link andou. Vale a última origem: o `guardarOrigem` troca a
origem guardada quando a URL nova traz parâmetros (comportamento de `src/lib/utm.ts`).

### Alfabeto

8 caracteres de `a-z` e `2-9` sem `0 o 1 l i` (31 símbolos, cerca de 8,5 × 10¹¹ combinações):
legível se alguém ditar o link. Gerado com `crypto.getRandomValues`, descartando os bytes que
enviesariam o sorteio.

## 3. Fila de pedidos

Colunas novas em `convites`, editadas à mão no Table Editor:

| Coluna | Uso |
|---|---|
| `status` | `novo` (padrão), `chamado`, `convidado`, `ativo`, `desistiu` |
| `chamado_em` | quando um sócio fez o primeiro contato |
| `convidado_em` | quando o convite (a turma) saiu |
| `nota` | o que importa da conversa |

Views (só no painel, sem acesso pela API pública):

- `atrasados`: `novo` há mais de 3 dias úteis. Conferir todo dia útil.
- `semana_por_origem`: pedidos dos últimos 7 dias por origem (indicação, cada `utm_source`, direto)
  e por perfil. Ler às segundas.
- `indicacoes`: quem indicou quem, e quando.

**Prazo prometido:** só o **primeiro contato** em até 3 dias úteis. O convite sai por turmas, no
ritmo que os sócios conseguirem acompanhar.

## 4. Banco

`supabase/003_indicacao_e_fila.sql`: coluna `codigo_indicacao` com `check` da regex e índice comum;
colunas da fila; `grant select (nome, cidade, codigo_indicacao)` para `service_role` (o aviso
precisa ler quem indicou); as três views com `security_invoker` e `revoke` de `anon` e
`authenticated`.

**Ordem:** rodar o SQL antes de publicar o Worker novo. Com o Worker novo e sem a coluna, o
Supabase recusa todo pedido.

## 5. WhatsApp da empresa e medição

- **`WHATSAPP_EMPRESA`** em `src/data/conteudo.ts`, vazia até os sócios definirem. Fica no código
  e não em variável de build: é público, muda pouco, e assim não depende do painel (lição da NT-001
  §16). Vazia ou inválida, o bloco "Salve nosso número" some.
- **Cloudflare Web Analytics** (decisão do Thiago): sem cookies, mede visitas para calcular a taxa de
  conversão. Token público na constante `CLOUDFLARE_ANALYTICS_TOKEN`; vazio, não carrega nada.
- **Domínio de terceiro:** o padrão de `site` passa a ser o `workers.dev` e o e-mail sai do JSON-LD
  até haver domínio próprio. Sem isso, o preview do link de indicação no WhatsApp puxaria a imagem
  do domínio do terceiro.

## 6. Privacidade

A política passa a citar o código aleatório de indicação, o `localStorage` (que não expira ao fechar
a aba) e o Web Analytics sem cookies. Data de atualização: 13/10/2026.

## 7. Para depois

Recompensa por indicação; regra de prioridade para quem indica (quando houver capacidade medida);
contador de cliques nos botões; 301 do `workers.dev` para o domínio final preservando a query.

## 8. Revisão final da implementação (13/10/2026)

- **"Errou algum dado? Enviar de novo" no mesmo dia:** o banco recusa o segundo pedido do mesmo
  WhatsApp, então a correção não é gravada. O Worker passa a mandar ao grupo um aviso marcado
  "Reenvio do mesmo WhatsApp hoje (dados novos, não gravados: corrija na fila)", com os dados
  novos, para os sócios corrigirem a linha à mão.
- **SQL 003 depois do deploy:** se o banco ainda não tiver a coluna `codigo_indicacao` (PGRST204),
  o Worker grava o pedido sem o código e registra no log. A ordem certa continua sendo SQL antes
  do push, mas um engano não derruba mais o formulário.

