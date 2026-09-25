---
name: adr-0011-adotar-vitest
description: Vitest como runner de testes de unidade, com config própria separada do vite.config.ts e testes colados ao arquivo testado
metadata:
  type: decision
  status: accepted
---

# ADR-0011: Adotar Vitest para testes de unidade

> Vitest roda os testes de unidade (`*.test.ts(x)` colados ao arquivo, dentro da slice FSD), com
> `vitest.config.ts` próprio. A primeira leva cobriu só lógica pura, em ambiente `node`.

## Status

`Accepted` — 2026-09-03 (commit `3ec059c`). **O ambiente `node` foi substituído por `jsdom` pelo
[ADR-0012](0012-cobertura-com-ratchet-e-rtl.md)** (2026-09-22); o resto continua valendo.
Registrado retroativamente em 2026-09-25.

## Contexto

Zero teste de unidade era um dos dois maiores gaps de ferramental do projeto (o outro era o lint,
[ADR-0013](0013-oxlint-por-categorias-e-pre-commit.md)). A stack já é Vite. A regra de negócio
mora no back, então o alvo inicial era a lógica pura mais exposta a regressão silenciosa.

## Decisão

- **Vitest**, `vitest.config.ts` **próprio** (não misturado ao `vite.config.ts` — os dois
  `UserConfig` colidem de tipo); alias `@` declarado lá.
- `include: ['src/**/*.test.{ts,tsx}']` — `e2e/` é Playwright (`*.spec.ts`), não vitest.
- Testes colados ao arquivo testado (colocation, igual à FSD) — nunca `__tests__` central.
- Primeira leva (40 testes, ambiente `node`): `shared/lib/format`, `shared/lib/parse-csv`,
  `entities/protocolo/lib/filtros`, `entities/protocolo/lib/prazo-chip`,
  `entities/regraAlcada/lib/frase`.
- `vitest` **não** entra no `lint-staged` — fricção em todo commit sem CI; o momento de rodar é
  `npm run check`/skill `web-gate`.

## Alternativas consideradas

| Alternativa                                | Prós                           | Contras                                                  | Por que foi descartada          |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------------- | ------------------------------- |
| Config de teste dentro do `vite.config.ts` | Um arquivo só                  | Conflito de tipos entre `UserConfig` do Vite e do Vitest | Não compila limpo               |
| Rodar vitest no pre-commit                 | Pega regressão antes do commit | Todo commit fica lento, sem CI pra também gatear         | O `gate` no fim da tarefa cobre |

## Características impactadas

| Característica       | Impacto    | Justificativa               |
| -------------------- | ---------- | --------------------------- |
| Testabilidade        | ✅ Melhora | Runner nativo da stack Vite |
| Velocidade do commit | ➖ Neutro  | Testes fora do hook         |

## Consequências

Base pra cobertura com ratchet e testes de componente ([ADR-0012](0012-cobertura-com-ratchet-e-rtl.md)).

## Referências

- `vitest.config.ts`, [testing-strategy](../patterns/testing-strategy.md)
