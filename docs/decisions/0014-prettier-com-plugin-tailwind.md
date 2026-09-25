---
name: adr-0014-prettier-com-plugin-tailwind
description: Prettier com semi false, singleQuote, printWidth 120 e prettier-plugin-tailwindcss apontado pro CSS do @theme, aplicado ao repo inteiro de uma vez
metadata:
  type: decision
  status: accepted
---

# ADR-0014: Prettier com `prettier-plugin-tailwindcss`

> `.prettierrc.json`: `semi: false`, `singleQuote: true`, `printWidth: 120`,
> `prettier-plugin-tailwindcss` com `tailwindStylesheet: ./src/app/styles/index.css`. Repo
> reformatado inteiro de uma vez, por último no backlog de ferramental.

## Status

`Accepted` — 2026-09-03 (commit `3ec059c`). Registrado retroativamente em 2026-09-25.

## Contexto

Ordem de classe Tailwind era manual (e o [ADR-0004](0004-cva-e-primitivos-contra-parede-de-classes.md)
já apontava o plugin como próximo passo). O código já seguia sem ponto-e-vírgula e com aspas
simples à mão. Tailwind v4 não tem `tailwind.config.js` central pro plugin inspecionar.

## Decisão

- `semi: false`, `singleQuote: true` — só formaliza o que o código já fazia (conferido lendo
  arquivos antes de fixar).
- `printWidth: 120` — o p90 das linhas do projeto (fora os arquivos vendorizados do shadcn) já
  ficava em ~96 caracteres; 120 evita um diff gigante à toa sem ficar ilegível.
- `tailwindStylesheet` aponta pro `@theme` — sem isso o plugin não sabe onde entram os tokens
  customizados (`bg-ok-bg`, `text-text-2`…). Testado isolado antes do reformat
  (`bg-card p-2 flex items-center text-foreground` → `flex items-center bg-card p-2 text-foreground`).
- **Reformat do repo inteiro de uma vez**, deliberadamente depois das outras fases do backlog
  (rodar antes duplicaria diff em arquivos que ainda iam mudar). Scripts `format`/`format:check`;
  `lint-staged` roda `prettier --write` antes do `oxlint`.

## Alternativas consideradas

| Alternativa                                        | Prós           | Contras                                     | Por que foi descartada                       |
| -------------------------------------------------- | -------------- | ------------------------------------------- | -------------------------------------------- |
| `printWidth` padrão (80)                           | Default        | Quebraria a maioria das linhas existentes   | Diff enorme sem ganho                        |
| Reformat incremental (só arquivo tocado)           | Diffs pequenos | Estilo misto por meses                      | Um diff único, só de formatação, verificável |
| Rodar o reformat antes das outras fases do backlog | Mais cedo      | Duplicaria diff em arquivos ainda em edição | Deixado por último de propósito              |

## Características impactadas

| Característica     | Impacto    | Justificativa                                                       |
| ------------------ | ---------- | ------------------------------------------------------------------- |
| Consistência       | ✅ Melhora | Formatação e ordem de classe automáticas                            |
| Risco de regressão | ➖ Neutro  | Bundle de produção com o mesmo tamanho gzip antes/depois (86,85 kB) |

## Consequências

Reordenação de classe pode colidir via `twMerge` em casos raros — conferido com `verify-visual`
em Conferentes e Regras em vigor (sem diferença). Ver [tailwind](../patterns/tailwind.md).

## Referências

- `.prettierrc.json`, `.prettierignore`
