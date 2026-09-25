---
name: adr-0023-aviso-de-prioridade-alta-com-polling-e-sessionstorage
description: O aviso de prioridade alta da Minha fila (RF-24h/i/j) usa polling de 30s da própria query da fila e guarda os ids já anunciados em sessionStorage por usuário — sem SignalR/SSE e sem memória só em estado React
metadata:
  type: decision
  status: accepted
---

# ADR-0023: Aviso de prioridade alta com polling de 30s e memória em sessionStorage

> A Minha fila se atualiza sozinha a cada 30s (`refetchInterval` na `useMinhaFila`), e os ids de
> prioridade alta já anunciados ficam em `sessionStorage` (`dispatch-alta-vistos:{usuarioId}`), pra
> que o toast avise cada protocolo uma vez por sessão — inclusive depois de um F5.

## Status

`Accepted — 2026-09-25`

## Contexto

A distribuidora marca prioridade Alta depois da importação (`DefinirPrioridadeDoProtocolo`), sem
rodar o motor de novo. O protocolo pode ficar parado no pool com a pílula "Alta" só no card — e o
pool mostra 5 cards (8 no celular), no celular o card pode estar em outra aba. Não havia atualização
automática nem aviso.

RF-24h/i/j (requisitos v2): faixa fixa enquanto existir alto no pool/atribuído/em conferência; a fila
"se atualiza a cada 30 s (indicador 'última há Ns')"; um protocolo alto que aparece pela primeira vez
dispara um toast, vários na mesma atualização viram um toast só, "o mesmo protocolo não avisa duas
vezes na sessão"; "Ver" leva ao card. O sistema não manda e-mail nem push (RNF, fora de escopo).

## Decisão

Vamos usar polling da própria query da fila e memória de sessão em `sessionStorage`, porque cobrem o
requisito sem infraestrutura nova:

- `useMinhaFila`: `refetchInterval: 30_000`, `refetchIntervalInBackground: false` (aba em segundo
  plano pausa; o refetch no focus cobre a volta). O `FilaDoConferenteBoard` ("ver como" da gestão)
  usa outra query e não ganha faixa nem toast.
- `widgets/minha-fila-board/lib/alta-vistos.ts`: `diffAltas(vistos | null, atuais)` — a primeira
  leitura da sessão (nada gravado) só registra, sem toast (a faixa já mostra); depois, "novo" é quem
  não estava no conjunto, e um id que sai e volta não é novo. Leitura/escrita com try/catch.
- `useAvisoPrioridadeAlta` compara a cada resposta nova (`dataUpdatedAt`), com `useEffectEvent` pra
  ler as `altas` e os callbacks do render mais recente sem virar dependência do efeito.

## Alternativas consideradas

| Alternativa                                   | Prós                           | Contras                                                                                                                                                                                      | Por que foi descartada                                              |
| --------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| SignalR/SSE (push do back ao marcar Alta)     | Aviso instantâneo              | Infraestrutura nova no back (hub, conexão persistente, reconexão) e no front só pra isso; Render free hiberna                                                                                | 30s atende o requisito ("a cada 30 s" é literal)                    |
| Memória só em estado React (como o protótipo) | Nada persistido                | F5 zera a memória: o primeiro carregamento depois do F5 registraria tudo de novo sem toast, e um alto que chegou durante o reload nunca seria anunciado; trocar de usuário na aba misturaria | `sessionStorage` por usuário resolve os dois e some ao fechar a aba |
| `localStorage`                                | Sobrevive a fechar o navegador | "Na sessão" é o requisito; um alto antigo nunca mais avisaria num dia seguinte, mesmo com outro turno                                                                                        | Escopo errado                                                       |

## Characteristics impactadas (-ilities)

| Characteristic    | Impacto          | Justificativa                                                    |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| Simplicidade      | ✅ Melhora       | Nenhum serviço novo; reaproveita TanStack Query                  |
| Carga no back     | ⚠️ Piora (pouco) | Um `GET /minha-fila` a cada 30s por conferente com a aba visível |
| Latência do aviso | ⚠️ Até ~30s      | Aceito pelo requisito                                            |

## Consequências

**Positivas** — o aviso sobrevive ao F5 sem repetir; a lógica de "novo" é pura e testada
(`alta-vistos.test.ts`, `use-aviso-prioridade-alta.test.tsx`).

**Negativas** — navegador que bloqueia armazenamento perde a memória (o pior caso é repetir um
toast, nunca quebrar a fila). O polling roda mesmo sem nada novo.

**Riscos** — se a tela de fila crescer muito, o refetch de 30s pode ficar caro; o sinal seria
lentidão da Minha fila, e o próximo passo seria um endpoint leve de "altas pendentes".

## Referências

- RF-24h/i/j; `docs/gaps-requisitos.md` §40; `PLANO-melhorias.md` Feature 2.
- `widgets/minha-fila-board/{lib/prioridade-alta.ts, lib/alta-vistos.ts, model/use-aviso-prioridade-alta.ts,
ui/AvisoPrioridadeAlta.tsx, ui/ListaAltasSheet.tsx, ui/IndicadorAtualizacao.tsx}`.
- ADR-0010 (divergências: coluna Atribuídas sem corte; memória em sessionStorage).
