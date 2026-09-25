---
name: adr-0007-filtros-de-protocolo-no-cliente
description: Filtros de Distribuição e Minha fila (RF-18e/RF-24f) são 100% client-side, via um predicado compartilhado aplicado a cada sub-lista
metadata:
  type: decision
  status: accepted
---

# ADR-0007: Filtros de protocolo 100% no cliente, via predicado

> A barra de filtros de Distribuição e Minha fila não chama endpoint: um hook compartilhado
> (`useFiltroProtocolos`, `widgets/filtro-protocolos`) devolve o predicado `passaNoFiltro`, e cada
> board filtra as próprias sub-listas com ele.

## Status

`Accepted` — 2026-09-01 (commit `7f86161`). **O eixo "Prazo" desta decisão (multisseleção das 4
faixas do semáforo) foi substituído pelo [ADR-0008](0008-eixo-prazo-como-alternador-urgente.md)**
no mesmo dia; o resto continua valendo. Registrado retroativamente em 2026-09-25.

## Contexto

RF-18e é explícito: "os filtros não alteram dado nenhum, só o recorte exibido". O
`DistribuicaoBoard` tem 5+ sub-listas (pool/atribuídos/emConferencia/concluídos/exceções/grupos
de `porConferente`) que precisam do mesmo estado de filtro aplicado de forma independente. O texto
do requisito era ambíguo sobre os eixos.

## Decisão

- **Sem endpoint novo**: o filtro roda sobre o que a visão já trouxe.
- **O hook devolve um predicado, não uma lista filtrada** — cada board faz
  `.filter(passaNoFiltro)` na própria lista; `.filter()` preserva a ordem por vencimento que o
  back já manda.
- **Eixos combináveis** (E entre eixos): equipe, tipo de ato, prioridade e prazo — interpretação
  assumida: "prioridade e prazo" são dois eixos separados. _(Eixo prazo: ver ADR-0008.)_
- **Contagem por opção sempre contra o conjunto completo não filtrado** (não contra o recorte dos
  outros eixos) — mais simples e ainda cobre "a gestão sabe o tamanho do recorte antes de aplicar".
- "Sem equipe" é valor legítimo de filtro, não ausência de filtro.

## Alternativas consideradas

| Alternativa                                              | Prós                           | Contras                               | Por que foi descartada                                              |
| -------------------------------------------------------- | ------------------------------ | ------------------------------------- | ------------------------------------------------------------------- |
| Filtro no back (query params)                            | Escala com volume              | Endpoint novo; refetch por clique     | RF-18e diz que filtro não altera dado; volume atual cabe em memória |
| Hook devolvendo lista já filtrada                        | API mais simples pra uma lista | Não serve 5+ sub-listas independentes | O board de Distribuição precisa aplicar em várias                   |
| Contagem contra o recorte já filtrado pelos outros eixos | Mais "exata"                   | Mais complexa                         | A simples já cumpre o objetivo do requisito                         |

## Características impactadas

| Característica       | Impacto    | Justificativa                                                                                                                 |
| -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Responsividade da UI | ✅ Melhora | Sem round-trip por clique                                                                                                     |
| Testabilidade        | ✅ Melhora | `protocoloPassaNoFiltro` é função pura com suíte própria                                                                      |
| Escala               | ⚠️ Piora   | Tudo em memória; nenhum endpoint pagina (ver [ADR-0019](0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md)) |

## Consequências

**Riscos** — depende de leituras auxiliares (equipes/escreventes/tipos) permitidas pro papel
logado; o 403 silencioso de 2026-09-01 é o exemplo ([ADR-0006](0006-back-manda-fato-cru-front-resolve-nomes.md)).
Chamar o hook depois de um early return quebrou as Rules of Hooks (achado em revisão, ver
[codigo-react](../patterns/codigo-react.md)).

## Referências

- `entities/protocolo/lib/filtros.ts`, `widgets/filtro-protocolos/`
- `widgets/filtro-protocolos/model/use-filtro-protocolos.test.ts`
