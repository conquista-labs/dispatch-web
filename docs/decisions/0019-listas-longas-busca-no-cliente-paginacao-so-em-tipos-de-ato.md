---
name: adr-0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato
description: Listas longas são mitigadas no cliente (busca + rolagem contida); paginação de verdade no servidor existe só em Tipos de ato, por pedido explícito
metadata:
  type: decision
  status: accepted
---

# ADR-0019: Listas longas — busca e rolagem no cliente; paginação no servidor só em Tipos de ato

> Nenhum endpoint pagina, exceto `GET /tipos-ato/com-uso`. As listas que crescem são mitigadas no
> cliente com busca + `max-h-[Npx] overflow-y-auto` + contador "N de M". Paginação de verdade
> entra lista por lista, quando o volume ou o dono justificar.

## Status

`Accepted` — 2026-09-15 (auditoria de listagens, commit `95b4551`; paginação de Tipos de ato,
commit `8a2e77c`). Registrado retroativamente em 2026-09-25.

## Contexto

Pedido do dono: revisar listagens compridas sem filtro nem corte. O levantamento (front + back)
confirmou que **nenhum endpoint pagina** (sem `Take`/`Skip`/cursor; só o corte de 30 dias em
"concluídos" da Distribuição). Os 4 piores casos foram corrigidos com o padrão client-side que já
existia em Alçada → Camadas. Em Tipos de ato, a primeira versão também foi busca + rolagem; o dono
apontou que isso "não é paginação de fato" e pediu a coisa real **só para essa lista**.

## Decisão

- **Padrão geral (cliente)**: `Input` de busca + container `max-h-[420px|480px|560px]
overflow-y-auto` + "N de M" quando a busca reduz; mensagem distinta pra "vazio" vs. "nada bate
  com a busca". Detalhes e exceções em [lists-and-long-content](../patterns/lists-and-long-content.md).
- **Tipos de ato (servidor)** — primeira paginação real do sistema: `busca`/`pagina`/`tamanhoPagina`
  no back (`Paginado<T>`), `queryKey` com os parâmetros, `placeholderData: (anterior) => anterior`,
  busca com `useDebouncedValue` (300ms), `TAMANHO_PAGINA = 20`, só Anterior/Próxima (sem números
  de página, catálogo pequeno).

## Alternativas consideradas

| Alternativa                                           | Prós                    | Contras                                                  | Por que foi descartada              |
| ----------------------------------------------------- | ----------------------- | -------------------------------------------------------- | ----------------------------------- |
| Paginação no servidor em todas as listas              | Escala de verdade       | Endpoint e estado novos por lista, volume atual não pede | Entra quando/se o volume justificar |
| Só busca + rolagem também em Tipos de ato (1ª versão) | Consistente com o resto | "Não é paginação" — pedido explícito do dono             | Pivotado na mesma conversa          |
| Truncar com "+N" (como as colunas de protocolo)       | Compacto                | Esconde itens que exigem ação (exceções)                 | Usado só onde a lista é consulta    |

## Características impactadas

| Característica | Impacto         | Justificativa                     |
| -------------- | --------------- | --------------------------------- |
| Usabilidade    | ✅ Melhora      | Listas não esticam a página       |
| Escala         | ⚠️ Piora        | Tudo em memória fora Tipos de ato |
| Consistência   | ⚠️ Piora (leve) | Dois mecanismos coexistem         |

## Consequências

Tipos de ato paginado quebrou um teste E2E que procurava o item recém-criado em qualquer página
(ver [e2e-tests](../patterns/e2e-tests.md)). Conferentes segue sem filtro (risco baixo hoje) —
[gaps-requisitos](../gaps-requisitos.md).

## Referências

- `widgets/central-de-regras-board/ui/AbaTiposDeAto.tsx`, `shared/lib/use-debounced-value.ts`,
  `shared/ui/pagination.tsx`
