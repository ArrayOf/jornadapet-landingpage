# NT-004 — Pós-inscrição e indicação

**Data:** 13/10/2026 · **Spec:** [2026-10-13-copy-v2-e-indicacao-design.md](../superpowers/specs/2026-10-13-copy-v2-e-indicacao-design.md) §4 ·
**Antes:** [NT-001](NT-001-landing-page.md) §15 a §18

## 0. Por quê

Quem acabou de pedir o convite está no pico de intenção, e a tela de sucesso só diz "vamos chamar
você". Adestradores se conhecem em cursos, grupos de WhatsApp e eventos: a indicação de um colega
é o canal mais barato e mais confiável para esse público. A tela passa a pedir uma coisa só:
mandar o link para outro adestrador.

## 1. Tela de sucesso

```text
┌───────────────────────────────────────────────┐
│  ✓  Recebemos, Camila!                         │
│     Vamos chamar você no WhatsApp              │
│     (19) 99876-1234 em até 3 dias úteis.       │
│                                                │
│     Salve nosso número para reconhecer a       │  ← só com WHATSAPP_EMPRESA
│     mensagem: (11) 9xxxx-xxxx                  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ Conhece outro adestrador?                │  │
│  │ Mande o link para ele pedir o convite    │  │
│  │ também.                                  │  │
│  │ [ Enviar pelo WhatsApp ] [ Copiar link ] │  │
│  └──────────────────────────────────────────┘  │
│     Enviar outro contato                       │
└───────────────────────────────────────────────┘
```

- **Enviar pelo WhatsApp** é o botão principal (oliva): é onde esse público conversa.
- **Copiar link** é secundário (borda), para Instagram e outros grupos.
- O cartão de indicação usa o pastel sálvia (`mint`, "clientes"), sem cor nova.

## 2. Como a indicação é rastreada

```text
navegador da Camila                 Worker                    Supabase
  código "k7m2pq9x" (localStorage)
  pedido ──── codigo_indicacao ────▶ valida regex ──────────▶ convites.codigo_indicacao
  link /?ref=k7m2pq9x  ──▶ amigo
navegador do amigo
  ?ref=k7m2pq9x (sessionStorage)
  pedido ──── ref ─────────────────▶ (já existia) ──────────▶ convites.ref
                                     aviso: "Indicação: código k7m2pq9x"
                                                              view indicacoes: ref ↔ codigo
```

### Opções consideradas

| Opção | Resultado |
|---|---|
| `ref` com o nome ou o WhatsApp de quem indicou | **Descartada:** o link circula em grupos e exporia dado pessoal |
| Código gerado pelo servidor e devolvido na resposta | **Descartada:** o insert usa `return=minimal` e o reenvio do mesmo dia (409) não grava; o servidor não teria o código para devolver |
| **Código aleatório gerado no navegador e guardado no `localStorage`** | **Escolhida:** sem dado pessoal, sem ida e volta extra, estável entre reenvios no mesmo navegador |

**Limite aceito:** se a pessoa reenviar no mesmo dia por **outro** navegador, o código novo não é
gravado (o banco recusa o segundo pedido do dia) e indicações por esse link não se ligam a ela. É
raro e não perde o pedido de ninguém.

### Alfabeto

8 caracteres de `a-z` e `2-9` sem `0 o 1 l i` (31 símbolos, cerca de 8,5 × 10¹¹ combinações):
legível se alguém ditar o link. Gerado com `crypto.getRandomValues`, nunca `Math.random`.

## 3. Banco

`supabase/003_indicacao.sql`:

- coluna `codigo_indicacao text`, com `check` da regex;
- índice único parcial em `codigo_indicacao` (`where codigo_indicacao is not null`);
- view `indicacoes` (`security_invoker`), que liga `convites.ref` a `convites.codigo_indicacao`:
  quem indicou, quem chegou, quando. Sem `grant` para `anon` e `authenticated`: só o painel.

**Ordem:** rodar o SQL antes de publicar o Worker novo. Com o Worker novo e sem a coluna, o
Supabase recusa todo pedido.

## 4. WhatsApp da empresa

Constante `WHATSAPP_EMPRESA` em `src/data/conteudo.ts`, vazia até os sócios definirem o número. Fica
no código, não em variável de build: é público, muda raramente e assim não depende do painel (lição
da NT-001 §16 com `PUBLIC_TURNSTILE_SITE_KEY`). Vazia ou inválida (`whatsappValido`), o bloco some.

## 5. Privacidade

A política passa a citar o código aleatório de indicação no "O que coletamos" e o `localStorage`
no "O que fica no seu navegador", que hoje fala só de `sessionStorage`. A data de atualização muda
para 13/10/2026.

## 6. Fora desta nota

Recompensa por indicação (prioridade na fila, meses grátis): decisão de negócio dos sócios.
