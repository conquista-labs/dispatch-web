---
name: adr-0015-breakpoint-mobile-760
description: Um único corte responsivo de 760px (RNF-13), declarado como --breakpoint-mobile no @theme do Tailwind, com hook JS useIsMobile só quando a estrutura muda
metadata:
  type: decision
  status: accepted
---

# ADR-0015: Breakpoint mobile de 760px via `@theme`

> `--breakpoint-mobile: 760px` no `@theme inline` gera as variantes `mobile:`/`max-mobile:`. CSS
> puro sempre que só a classe muda; `useIsMobile()` (JS) só quando a árvore de componentes ou a
> quantidade de itens muda de verdade.

## Status

`Accepted` — 2026-09-04 (commit `2819449`). Registrado retroativamente em 2026-09-25.

## Contexto

RNF-13 pede o app inteiro responsivo abaixo de **760px**; RF-24g pede Minha fila em abas no
mobile. O Tailwind padrão tem `md` = 768px; dois blocos já usavam `md:grid-cols-2`.

## Decisão

- `--breakpoint-mobile: 760px` no `@theme inline` de `app/styles/index.css` — o Tailwind v4 gera
  `mobile:`/`max-mobile:` sozinho (conferido no CSS compilado: `@media (width>=760px)` /
  `@media not all and (width>=760px)`).
- `shared/lib/use-is-mobile.ts` (`matchMedia` + listener `change` + cleanup, mesmo molde de
  `use-now.ts`) **só** onde a estrutura muda (AppShell vira header + nav de chips; Minha fila vira
  abas; pool mostra 8 itens). Os dois lugares têm comentário apontando um pro outro — o número 760
  não pode vir de uma constante JS compartilhada com o CSS.
- Os `md:grid-cols-2` existentes viraram `mobile:grid-cols-2` — um corte só no app.

## Alternativas consideradas

| Alternativa              | Prós              | Contras                                             | Por que foi descartada             |
| ------------------------ | ----------------- | --------------------------------------------------- | ---------------------------------- |
| Usar `md` (768px) padrão | Zero configuração | 8px diferente do requisito; dois cortes coexistindo | RNF-13 diz 760                     |
| Hook JS pra tudo         | Um mecanismo só   | Re-render e lógica onde CSS resolve                 | CSS puro é mais barato e não pisca |

## Características impactadas

| Característica          | Impacto    | Justificativa                                       |
| ----------------------- | ---------- | --------------------------------------------------- |
| Fidelidade ao requisito | ✅ Melhora | Corte exato de RNF-13                               |
| Manutenibilidade        | ⚠️ Atenção | 760 duplicado entre CSS e hook (comentado nos dois) |

## Consequências

Como aplicar em cada tipo de elemento (grids de KPI, tiras de pills, tabelas largas, alvo de
toque de 44px) em [responsive](../patterns/responsive.md). `vitest.setup.ts` precisa de polyfill
de `matchMedia` por causa do hook e da store de tema.

## Referências

- `src/app/styles/index.css`, `src/shared/lib/use-is-mobile.ts`
