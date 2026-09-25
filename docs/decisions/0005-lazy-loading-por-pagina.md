---
name: adr-0005-lazy-loading-por-pagina
description: Cada página (exceto login) é carregada com React.lazy + um Suspense único em volta das rotas, em vez de um bundle único
metadata:
  type: decision
  status: accepted
---

# ADR-0005: Lazy loading por página

> `app/routing/router.tsx` carrega cada `*Page` com `React.lazy`, exceto `LoginPage` (faz parte do
> boot de qualquer sessão não autenticada), com um `<Suspense>` envolvendo o `<Routes>` inteiro.

## Status

`Accepted` — 2026-08-31 (commit `a7d893d`). Registrado retroativamente em 2026-09-25.

## Contexto

O build gerava um bundle único de ~655 kB, acima do limiar de aviso do Vite. Quem abria o app
baixava o código de todas as telas, inclusive as do outro papel.

## Decisão

`React.lazy(() => import('@/pages/x').then(m => ({ default: m.XPage })))` por página — o `.then`
é necessário porque as páginas exportam nomeado (`export { XPage }`) e `React.lazy` só aceita
módulo com `default`. Um único `<Suspense fallback={<CarregandoPagina />}>` (que usa o
`Carregando` unificado, [ADR-0018](0018-loading-com-spinner-unificado.md)).

## Alternativas consideradas

| Alternativa                    | Prós                                                     | Contras                                          | Por que foi descartada                               |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Bundle único (estado anterior) | Zero configuração; nenhuma tela "carregando" entre rotas | ~655 kB no primeiro acesso, aviso do Vite        | Custo pago por quem nunca visita a maioria das telas |
| Lazy por página (escolhido)    | Chunk por rota                                           | Fallback de carregamento em navegação por reload | —                                                    |

## Características impactadas

| Característica                 | Impacto    | Justificativa                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| Performance do primeiro acesso | ✅ Melhora | Core compartilhado ~241 kB; telas de ~1 kB a ~96 kB (`importar` é a maior, por `calendar`/`date-fns`) |
| Testabilidade E2E              | ⚠️ Piora   | Screenshot logo após `page.goto` pode pegar o fallback                                                |

## Consequências

**Negativas** — testes Playwright precisam esperar um heading/texto da tela antes de
`page.screenshot` depois de um reload completo (achado em 2026-09-01, ver
[e2e-tests](../patterns/e2e-tests.md)).

## Referências

- `src/app/routing/router.tsx`
