---
name: responsive
description: Como deixar uma tela responsiva abaixo de 760px (RNF-13) e a fila do conferente em abas (RF-24g) — mecanismo de breakpoint, padrões por tipo de elemento e como verificar
metadata:
  type: pattern
  domains: [responsivo, ui, tailwind]
  status: stable
---

# Responsivo (RNF-13 / RF-24g)

> Decisão do breakpoint em [ADR-0015](../decisions/0015-breakpoint-mobile-760.md).

## Quando recorrer a isto

- Tela nova ou bloco novo com grid, tira de pills, tabela ou cabeçalho com vários botões
- Mudança em `AppShell`, Minha fila ou Fila do conferente

## Mecanismo

- `mobile:` (≥760px) / `max-mobile:` (<760px), gerados de `--breakpoint-mobile` no `@theme`.
- `useIsMobile()` só quando a **estrutura** muda (componentes ou quantidade de itens). Resto é CSS.
- Não use `md:` (768px) — dois cortes quase iguais coexistindo.

## Padrões por tipo de elemento

| Elemento                             | Padrão                                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grid de KPI (4–5 colunas fixas)      | `max-mobile:grid-cols-2` (Dashboard, Conferentes, Aprendizado)                                                                                                                                                                        |
| Bloco de 2 colunas                   | `mobile:grid-cols-2` (ou `grid-cols-2 max-mobile:grid-cols-1`)                                                                                                                                                                        |
| Tira de pills/abas                   | `overflow-x-auto` no container + `flex-none whitespace-nowrap` nos botões                                                                                                                                                             |
| Tabela/grade larga                   | `overflow-x-auto` contido + `min-w-max` nas linhas — **nunca** deixar o documento inteiro rolar pro lado (o protótipo tem esse bug em "O que cada um alcança hoje": `scrollWidth` 521 > `clientWidth` 390, arrastando até a nav fixa) |
| Colunas de protocolo "Por status"    | piso `min-w-[220px]` + container `overflow-x-auto` (como "Por conferente")                                                                                                                                                            |
| Cabeçalho com título + vários botões | `flex-wrap` no container + `max-mobile:w-full` no grupo de botões                                                                                                                                                                     |
| Input de busca com `min-w`           | `max-mobile:min-w-0 max-mobile:basis-full` (empilha)                                                                                                                                                                                  |
| Sheets/popovers                      | Já usam `min(Npx, 92vw)` — sem ajuste                                                                                                                                                                                                 |
| `Table` do shadcn                    | Já envolve em `overflow-x-auto`                                                                                                                                                                                                       |

## Estruturas que mudam no mobile

- **`AppShell`**: a sidebar de 224px vira header sticky (logo + toggle de tema + Sair) + `<nav>`
  sticky com os itens como chips roláveis (`overflow-x-auto whitespace-nowrap`), badge dentro do
  chip. Card de sessão fica de fora (o protótipo também não mostra). `LogoutButton` aceita
  `className`. A sidebar recolhível (rail de 68px) é só desktop.
- **Minha fila / Fila do conferente (RF-24g)**: `FilaColunas` (`widgets/minha-fila-board/ui/`,
  exportado no barrel) — desktop `flex` lado a lado; mobile abas com contador (pill-tabs), só a
  ativa renderiza. `MAX_POOL_VISIVEL_MOBILE = 8` (literal do requisito).
- **Alvo de toque de 44px** só nos 4 botões que o requisito cita (Pegar este / Iniciar
  conferência / Aprovar / Não aprovar): `max-mobile:h-11 max-mobile:text-[14px]`. Os secundários
  de `ConcluidosHojeList` ficam de fora de propósito.

## Verificar

Playwright em **390px** e **1280px** (regressão de desktop), nos dois temas, checando
`document.documentElement.scrollWidth <= clientWidth` em cada tela tocada (e, se exceder, simulando
o scroll com `window.scrollTo` pra ver o que desliza junto) e medindo alvos de toque com
`boundingBox().height`. Antes de implementar algo novo, vale navegar o protótipo em 390px — ele
mesmo pode ter o bug.

## Referências

- `widgets/app-shell/ui/AppShell.tsx`, `widgets/minha-fila-board/ui/FilaColunas.tsx`,
  `widgets/minha-fila-board/lib/constantes.ts`
