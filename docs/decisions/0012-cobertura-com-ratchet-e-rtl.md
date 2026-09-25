---
name: adr-0012-cobertura-com-ratchet-e-rtl
description: Cobertura v8 com thresholds em ratchet (autoUpdate, só sobem) e testes de componente/hook com React Testing Library em jsdom — sem meta fixa de percentual
metadata:
  type: decision
  status: accepted
---

# ADR-0012: Cobertura com ratchet e testes de componente com RTL

> `@vitest/coverage-v8` com `include` de todo `src/` e `thresholds.autoUpdate: true`: o piso começa
> no real e só sobe; run que cobre menos falha. RTL entra pra componente e hook, com ambiente
> `jsdom` global. Sem meta fixa (80% etc.) e sem MSW por enquanto.

## Status

`Accepted` — 2026-09-22 (commit `3935730`; ratchet subindo nos commits seguintes do mesmo dia até
lines 14,47% · functions 12,35% · branches 11,8% · statements 15%, 132 testes). Substitui o
ambiente `node` do [ADR-0011](0011-adotar-vitest.md). Registrado retroativamente em 2026-09-25.

## Contexto

Pedido do dono: "não temos nada de teste unitário no front". O levantamento matizou: havia 5
suítes (~42 testes), só de função pura, sem DOM, sem nenhuma medição de cobertura. Convenções
adotadas do repo vizinho `swap/frontend/swap-benefits-web` (skills `testing-strategy`/`gate`,
`docs/patterns/testing-strategy.md`, ADR-0002/0005 de lá), que o dono já validou em projeto real —
adaptadas: lá existe "E2E obrigatório pra operação financeira", sem equivalente neste domínio, e
lá a regra de negócio mora no front; **aqui cai pro back**.

## Decisão

- **Cobertura**: `@vitest/coverage-v8`, `reporter: ['text', 'html']`,
  `include: ['src/**/*.{ts,tsx}']` (sem ele o v8 só reporta arquivo que algum teste carregou,
  escondendo o que ninguém testa). `exclude` mínimo, cada item com motivo no arquivo — exclusão é
  "estruturalmente 0% pra sempre" (`*.d.ts`, os testes, `main.tsx`, helper de teste), nunca
  "falta testar". **Primitivos vendorizados do shadcn ficam no denominador**: aqui eles são
  editados à mão (`progress.tsx`, `calendar.tsx`, `popover.tsx`).
- **Ratchet**: `thresholds.autoUpdate: true`. Primeira run: lines 7,53% · functions 5,32% ·
  branches 4,99% · statements 7,86%. O diff do `vitest.config.ts` é commitado junto com os
  testes que o ganharam; **nunca abaixado na mão**. Confirmado que tem dente: com
  `--coverage.thresholds.lines=50` o vitest sai com exit 1.
- **RTL**: `@testing-library/react` + `/dom` + `/jest-dom` + `/user-event` + `jsdom`;
  `environment: 'jsdom'` global (as suítes puras rodam igual; mais simples que pragma por arquivo);
  `plugins: [react()]`; `vitest.setup.ts` com `afterEach(cleanup)` e polyfill de `matchMedia`;
  `shared/lib/test/render-with-providers.tsx` (QueryClient novo por teste + `MemoryRouter`).
- **Ordem de prioridade** (regra de negócio no back): lógica pura → regressão de bug que já
  aconteceu → estado de hook → componente com condicional.
- Scripts: `test:coverage`, `check` (`tsc -b && oxlint && vitest run --coverage`).

## Alternativas consideradas

| Alternativa                                    | Prós                          | Contras                                      | Por que foi descartada                                                         |
| ---------------------------------------------- | ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Meta fixa (ex.: 80%) com prazo                 | Número claro                  | Arbitrária num repo que parte de ~7%         | O ratchet garante a curva sem número inventado                                 |
| Excluir `shared/ui` vendorizado do denominador | Número maior                  | Esconde código editado à mão que já teve bug | Aqui o vendorizado não é "gerado, nunca editado"                               |
| Pragma `@vitest-environment jsdom` por arquivo | Suítes puras em `node`        | Pragma em todo `*.test.tsx`                  | jsdom global é mais simples; custo de ms aceitável                             |
| MSW pra mock de rede                           | Mock consistente entre testes | Dependência e setup a mais                   | Mockar só `api/` (`vi.mock`) basta hoje; entra quando vários testes precisarem |

## Características impactadas

| Característica    | Impacto    | Justificativa                                                   |
| ----------------- | ---------- | --------------------------------------------------------------- |
| Testabilidade     | ✅ Melhora | Componente e hook exercitados pela primeira vez                 |
| Confiabilidade    | ✅ Melhora | Regressão de cobertura quebra o `check`                         |
| Tamanho do bundle | ➖ Neutro  | Tudo devDependency (chunk principal seguiu 284 kB / 89 kB gzip) |

## Consequências

Gotchas de setup (matchers do jest-dom no `tsc`, 2º argumento da `mutationFn`) em
[testing-strategy](../patterns/testing-strategy.md). Política operacional na skill
`web-testing-strategy`; cadeia de verificação na skill `web-gate`.

## Referências

- `vitest.config.ts`, `vitest.setup.ts`, `src/vitest-env.d.ts`
- [docs/historico.md](../historico.md) — "Estratégia de testes"
