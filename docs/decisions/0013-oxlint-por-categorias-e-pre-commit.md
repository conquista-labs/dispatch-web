---
name: adr-0013-oxlint-por-categorias-e-pre-commit
description: oxlint com categorias ligadas (correctness erro, suspicious/pedantic aviso), 6 regras desligadas com justificativa, e husky + lint-staged no pre-commit sem --max-warnings 0
metadata:
  type: decision
  status: accepted
---

# ADR-0013: oxlint por categorias + pre-commit com husky/lint-staged

> `.oxlintrc.json` liga categorias inteiras (`correctness: error`, `suspicious`/`pedantic: warn`)
> e desliga 6 regras que não fazem sentido aqui, cada uma com motivo. Pre-commit roda
> `lint-staged`; só erro bloqueia commit.

## Status

`Accepted` — 2026-09-03 (commit `3ec059c`). Registrado retroativamente em 2026-09-25.

## Contexto

O oxlint veio do scaffold do shadcn com só 2 regras soltas ligadas, nenhuma categoria, e não
estava no fluxo. Havia 8 avisos pré-existentes. Ligar as categorias sozinho surfaceu ~1500
achados.

## Decisão

- **Categorias**: `correctness: "error"`, `suspicious: "warn"`, `pedantic: "warn"`; plugins
  `react`, `typescript`, `oxc`; `react/rules-of-hooks: error`,
  `react/only-export-components` com `allowConstantExport`.
- **Triagem por frequência antes de reagir um por um.** Desligadas (com motivo):
  - `react/react-in-jsx-scope` — 1329 dos ~1500; assume o transform clássico do JSX, o projeto usa
    o automático do Vite.
  - `eslint/no-warning-comments` — a palavra portuguesa "todo" dispara em qualquer comentário.
  - `eslint/require-unicode-regexp` — ruído pedante, nenhuma regex depende disso.
  - `eslint/max-lines-per-function` e `eslint/max-lines` — contrariam a postura de
    [ADR-0004](0004-cva-e-primitivos-contra-parede-de-classes.md) (o sinal é repetição, não tamanho).
  - `eslint/no-inline-comments` — estilo puro, sem valor de correção.
- **Os achados genuínos são corrigidos, não silenciados** (os 8 avisos antigos por refatoração;
  ~20 achados novos: `eqeqeq`, `jsx-no-useless-fragment`, `no-negated-condition`,
  `no-unescaped-entities`, `no-promise-executor-return`, `no-shadow` +
  `no-unstable-nested-components`). Disable pontual só com comentário, e só onde a correção seria
  desproporcional (um `DayButton` em `calendar.tsx`, vendorizado). Estado alvo: `npm run lint` com
  0 erros e 0 avisos.
- **Pre-commit**: `husky` + `lint-staged` (`"*.{ts,tsx}": ["prettier --write", "oxlint"]` —
  formata antes de lintar). Só erro (`correctness`) derruba o exit code; **sem
  `--max-warnings 0`**.

## Alternativas consideradas

| Alternativa                               | Prós               | Contras                                 | Por que foi descartada                                             |
| ----------------------------------------- | ------------------ | --------------------------------------- | ------------------------------------------------------------------ |
| Manter só regras soltas (estado anterior) | Zero ruído         | Quase nada é checado                    | Era um dos dois maiores gaps de ferramental                        |
| Ligar categorias sem desligar nada        | Máxima cobertura   | ~1500 achados, a maioria falso positivo | Enterra os ~20 genuínos                                            |
| `--max-warnings 0` no pre-commit          | Nenhum aviso entra | Aviso pedante bloqueia commit           | A severidade das categorias já é a decisão de o que para um commit |

## Características impactadas

| Característica    | Impacto    | Justificativa                          |
| ----------------- | ---------- | -------------------------------------- |
| Correção          | ✅ Melhora | Rules of Hooks, `eqeqeq` etc. checados |
| Fricção de commit | ➖ Neutro  | Só erro bloqueia                       |

## Consequências

Padrões de correção que saíram daqui (ajustar estado durante o render em vez de
`useEffect(setState)`, `buttonVariants` em arquivo próprio) em
[codigo-react](../patterns/codigo-react.md).

## Referências

- `.oxlintrc.json`, `.husky/pre-commit`, `package.json` (`lint-staged`)
- [ADR-0014](0014-prettier-com-plugin-tailwind.md)
