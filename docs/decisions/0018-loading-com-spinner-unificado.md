---
name: adr-0018-loading-com-spinner-unificado
description: Carregamento de tela/dado usa um único componente Carregando (spinner Loader2Icon + texto, centralizado), não skeleton por tela
metadata:
  type: decision
  status: accepted
---

# ADR-0018: Loading unificado com spinner, não skeleton

> Todo carregamento de tela ou de dado usa `shared/ui/carregando.tsx`: bloco centralizado com
> `Loader2Icon` girando + texto. Skeleton do layout real foi considerado e descartado por ora.

## Status

`Accepted` — 2026-09-15 (commit `4e45deb`), escolha do dono entre as duas opções apresentadas.
Registrado retroativamente em 2026-09-25.

## Contexto

Pedido do dono ("esse loading tá muito feio"). Três formatos coexistiam: `<p>Carregando…</p>`
copiado à mão em 5 boards de tela inteira (Dashboard, Distribuição, Minha fila, Conferentes, Fila
do conferente), o componente `Carregando` (usado só nas 7 abas de Central de Regras + painel de
detalhe) e cópias em `session-boot.tsx` e no fallback do `<Suspense>` do router. Nenhum tinha
ícone. O protótipo não tem estado de loading — a forma teve que sair da linguagem visual existente.

## Decisão

Spinner: `Carregando` vira `flex flex-col items-center justify-center gap-2 py-14` com
`Loader2Icon` (`size-5 animate-spin`) + texto, `className` opcional. Os 5 boards, o `session-boot`
e o `CarregandoPagina` do router passam a usá-lo (os dois últimos dentro de
`flex min-h-screen items-center justify-center bg-background`, porque ficam fora do `AppShell`). Os
`className="mt-5"` compensatórios de 4 abas foram removidos.

## Alternativas consideradas

| Alternativa                                                                  | Prós                             | Contras                                      | Por que foi descartada       |
| ---------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------- | ---------------------------- |
| Skeleton do layout real de cada tela                                         | Mais polido                      | Sem precedente pra seguir, esforço bem maior | Escolha do dono pelo spinner |
| Spinner reaproveitando `Loader2Icon` (já usado em "Redistribuir pool"/toast) | Rápido, baixo risco, consistente | Menos informativo que skeleton               | —                            |

## Características impactadas

| Característica      | Impacto    | Justificativa                                  |
| ------------------- | ---------- | ---------------------------------------------- |
| Consistência visual | ✅ Melhora | Um formato só no app                           |
| Tema                | ➖ Neutro  | Cor via `text-muted-foreground`, troca sozinha |

## Consequências

**Fora de escopo, consciente**: os ~30 botões de ação com texto de pendência ("Salvando…",
"Criando…") sem ícone ficaram como estavam — padrão à parte, se um dia fizer sentido.

## Referências

- `src/shared/ui/carregando.tsx`, [design-system](../patterns/design-system.md)
