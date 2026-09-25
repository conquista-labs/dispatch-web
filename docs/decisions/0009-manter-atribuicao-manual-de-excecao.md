---
name: adr-0009-manter-atribuicao-manual-de-excecao
description: Resolver uma exceção na Distribuição exige escolher o conferente e confirmar, em vez do auto-atribuir ao primeiro apto que o protótipo simula
metadata:
  type: decision
  status: accepted
---

# ADR-0009: Manter a atribuição manual (com confirmação) ao resolver exceção

> Em Distribuição → Exceções, "Resolver" abre um seletor de conferente + confirmar. O protótipo
> atribui sozinho ao primeiro conferente apto ("sem alçada"/"barrado por regra") ou navega pra
> Central de Regras ("tipo novo"); aqui a escolha é humana e auditável.

## Status

`Accepted` — 2026-08-27 (commit `90176a3`), confirmada com o dono. Registrado retroativamente em
2026-09-25.

## Contexto

Verificando comportamento (não só aparência) lado a lado com o protótipo via `file://`, o fluxo
"Resolver" revelou uma divergência real: o protótipo nunca deixa a distribuidora escolher o
conferente nessa tela. RNF-02 pede auditabilidade.

## Decisão

Manter o seletor manual (escolher conferente + confirmar) nos dois casos. O auto-atribuir do
protótipo é lido como **atalho de ferramenta de design, não regra de negócio real**. Sem
restrição de alçada no seletor — mostra todo mundo (decisão consciente, ver back).

Evolução posterior, dentro da mesma decisão: desde 2026-09-15 o seletor é `SeletorUnico` (com
busca e nível como sub-rótulo, RNF-11) no lugar do `Select` puro, e `AtribuirManualmente` deixou
de ser exclusivo de exceção — o painel de detalhe ganhou "Atribuir a…/Reatribuir a…" pra Pool e
Atribuído.

## Alternativas consideradas

| Alternativa                                | Prós                           | Contras                              | Por que foi descartada            |
| ------------------------------------------ | ------------------------------ | ------------------------------------ | --------------------------------- |
| Auto-atribuir ao primeiro apto (protótipo) | Um clique                      | Exceção atribuída sem revisão humana | Menos seguro e auditável (RNF-02) |
| Seletor manual + confirmar (escolhido)     | Humano decide, fica registrado | Um passo a mais                      | —                                 |

## Características impactadas

| Característica          | Impacto    | Justificativa                            |
| ----------------------- | ---------- | ---------------------------------------- |
| Auditabilidade          | ✅ Melhora | Toda resolução tem uma escolha explícita |
| Fidelidade ao protótipo | ⚠️ Piora   | Divergência deliberada                   |

## Consequências

A tag da exceção é derivada de `motivoExcecao` (`tagDaExcecao`: "tipo desconhecido" → "tipo novo",
resto → "sem alçada") — o back não distingue "escala vazia" de "barrado por regra" como o
protótipo simula; ver [gaps-requisitos](../gaps-requisitos.md).

## Referências

- `widgets/distribuicao-board/ui/ExcecaoCard.tsx`
- [ADR-0010](0010-divergencias-deliberadas-do-prototipo.md)
