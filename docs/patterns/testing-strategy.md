---
name: testing-strategy
description: Critério de o que testar no dispatch-web (e o que vai pro back), onde cada teste vive na FSD, o ratchet de cobertura, o setup de RTL e os gotchas já pagos
metadata:
  type: pattern
  domains: [testing, fsd, qualidade]
  status: stable
---

# Estratégia de testes

> Vitest ([ADR-0011](../decisions/0011-adotar-vitest.md)), cobertura com ratchet + RTL
> ([ADR-0012](../decisions/0012-cobertura-com-ratchet-e-rtl.md)), Playwright
> ([ADR-0020](../decisions/0020-playwright-com-duas-categorias-de-spec.md), [e2e-tests](e2e-tests.md)).
> A skill `testing-strategy` aplica este documento a um diff; a skill `gate` roda a cadeia.

## Quando recorrer a isto

- Decidir se uma mudança precisa de teste de unidade, de componente, E2E ou nenhum
- Revisar código novo sem teste, ou uma run vermelha por cobertura
- Montar o primeiro teste de componente/hook de uma área

## A adaptação que mais importa: aqui a regra de negócio não mora no front

O critério nº 1 do repo de onde as convenções vieram (`swap-benefits-web`) é "decide
elegibilidade/valor → teste unitário primeiro". **Neste projeto isso cai pro back**: motor de
distribuição, alçada, prazo e score vivem no `dispatch-api`. Contra-exemplo real: o simulador
"Testar" da aba Alçada inferia o destino por contagem de elegíveis enquanto o motor decide por
urgência — a correção foi o back expor o resultado (`SimularAlcada`), não o front ganhar teste da
regra errada. Se a tela mostra algo que o back não calcula, o problema não é falta de teste.

## Ordem de prioridade

1. **Lógica pura** (formatação, predicado de filtro, frase de regra, parsing, migração de sessão)
   → unidade, colado no arquivo.
2. **Bug que já aconteceu** → regressão no mesmo commit do fix, sem exceção
   (`progress.test.tsx`, `popover.test.tsx`, `session-store.test.ts`, `use-alcada-builder.test.tsx`).
3. **Estado/fiação de hook** (`model/`) → `renderHook` (alternar liga/desliga, `limpar`, contagem
   contra o conjunto certo, timers com fake timers, `matchMedia` mockado).
4. **Componente com lógica condicional** (`ui/`) → RTL + `renderWithProviders`, `userEvent` (não
   `fireEvent`).

**Não merece teste automatizado**: componente só apresentacional (`Chip` é `cva` + span),
vendorizado nunca editado, `pages/` que só compõem. **Fidelidade visual não é teste de unidade** —
é `verify-visual`.

## Onde o arquivo vive

Colado ao arquivo testado, na mesma slice (`*.test.ts(x)`), nunca `__tests__` central.

| Segmento | O que testar                                                        |
| -------- | ------------------------------------------------------------------- |
| `lib/`   | Função pura — maior valor pelo menor custo                          |
| `model/` | Estado derivado, hook, mutation/query (mockando a função de `api/`) |
| `api/`   | Só se houver moldagem de request/resposta além do `httpClient` cru  |
| `ui/`    | Render + interação real                                             |

Extrair a lógica pra função pura quando ela está presa num framework (`migrarSessao` saiu de
dentro do `persist` pra ser testável sem Zustand/localStorage).

## Ratchet de cobertura

- `vitest.config.ts`: `include` de todo `src/`, `exclude` mínimo e comentado (`*.d.ts`, testes,
  `main.tsx`, `src/shared/lib/test/**`), `thresholds.autoUpdate: true`.
- Números só sobem. Run que cobriu mais reescreve o config — **commite esse diff junto** com os
  testes. Run que cobriu menos falha (exit 1).
- **Nunca abaixe à mão.** Redução deliberada (código morto apagado com o teste) é decisão explícita
  no commit.
- Linha descoberta: alcançável → teste; inalcançável → remova (aperte o tipo). **Mock esconde
  default**: teste o default onde ele mora (em `api/`).
- Sem meta de 80%; o ratchet garante a curva.

## Setup (e por quê)

- `environment: 'jsdom'` global; `plugins: [react()]`; `setupFiles: ['./vitest.setup.ts']`.
- `vitest.setup.ts`: `afterEach(cleanup)` (o Vitest não dá o global que o Jest dá; sem isso um
  render vaza e as queries acham dois elementos) e **polyfill de `window.matchMedia`** —
  obrigatório: `theme-store.ts` chama `matchMedia` no import e `use-is-mobile.ts` também.
- `shared/lib/test/render-with-providers.tsx`: `QueryClient` novo por teste (`retry: false`; o
  singleton do app vazaria cache) + `MemoryRouter` (`<Link>`/`useNavigate` quebram fora de Router).
- Mock só de `api/` (`vi.mock`), mantendo `Componente → hook → função` reais. Sem MSW.
- `vitest` fora do `lint-staged`; roda no `npm run check` / skill `gate`.

## Gotchas

- **TanStack Query v5 passa um 2º argumento pra `mutationFn`** (`{ client, meta, mutationKey }`) —
  use `expect(mock.calls[0][0]).toEqual(payload)`.
- **Matchers do jest-dom passavam em runtime e quebravam o `tsc -b`**: `vitest.setup.ts` fica fora
  do `include: ["src"]`, então a augmentação `declare module 'vitest'` não entrava no programa de
  tipos. Resolvido com `src/vitest-env.d.ts` (`import '@testing-library/jest-dom/vitest'`). Os
  `*.test.tsx` **são** type-checados pelo `tsc -b`.
- **Mock de API que rejeita: um `vi.fn()` novo por teste**, não `mockReset()` no `beforeEach`. Com o
  mock `const` resetado, o `mockRejectedValue` de um teste vazava como erro não tratado e derrubava o
  teste (aconteceu no 409 da troca de senha e no erro do conector de relatório). Padrão: `let api =
  vi.fn()`, o `vi.mock` delega (`(...a) => api(...a)`) e o `beforeEach` reatribui `api = vi.fn()`.
- **`tsc` passa e a tela continua errada** — o `Progress` invisível tipava certinho.
- **Um teste pode verificar o código e não a experiência**: se ele precisa desfazer uma ação do
  usuário pra observar um estado, pergunte se o usuário real veria esse estado.

## Comandos

`npm test` (vitest run), `npm run test:watch`, `npm run test:coverage`, `npm run check`
(`tsc -b && oxlint && vitest run --coverage`). Filtrar a saída:
`npm run test:coverage 2>&1 | grep -E "Tests |Test Files |ERROR|Statements|Branches|Functions|Lines|Updating"`.

## Referências

- `.claude/skills/testing-strategy`, `.claude/skills/gate`
- `vitest.config.ts`, `vitest.setup.ts`, `src/vitest-env.d.ts`
