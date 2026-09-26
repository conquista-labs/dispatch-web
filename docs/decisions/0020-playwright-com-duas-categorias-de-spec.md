---
name: adr-0020-playwright-com-duas-categorias-de-spec
description: Playwright headless (por Bash, lendo o PNG) como verificação visual e E2E, com duas categorias de spec — regressão permanente e verificação visual pontual — sem fixture automática de cenário
metadata:
  type: decision
  status: accepted
---

# ADR-0020: Playwright com duas categorias de spec

> `@playwright/test` roda headless via `npx playwright test` e o agente lê os screenshots — é o
> jeito de ver a tela sem ferramenta de browser interativa. Os specs em `e2e/` se dividem em
> **regressão permanente** (sempre passa, só depende de contas de login) e **verificação visual
> pontual** (depende de um cenário criado à mão; falhar sem re-semear é esperado).

## Status

`Accepted` — 2026-08-27 (commit `f86f395`). Complementado (não substituído) pelo
[ADR-0021](0021-global-setup-garante-contas-de-login.md) em 2026-09-15. Registrado
retroativamente em 2026-09-25. **A categoria 2 (verificação visual pontual) e o "não virar
fixture automática de cenário por ora" foram substituídos pelo
[ADR-0025](0025-cenario-e2e-montado-pela-api-no-proprio-teste.md)** em 2026-09-25.

## Contexto

Nenhuma sessão de Claude Code que construiu o projeto teve MCP de browser — o design system foi
traduzido do HTML do protótipo por leitura, nunca visto rodando. Login é e-mail/senha simples
(sem OAuth), então o teste pode logar de verdade. Projeto sem CI.

## Decisão

- **Playwright + ler o PNG** (`e2e/.screenshots/`, gitignored) é a verificação visual padrão
  (skill `verify-visual`), nos dois temas, com login real (sem bypass, sem token injetado quando
  depende de dado).
- **Categoria 1 — regressão permanente** (`auth`, `login`, `cursor`, `session-isolation`, e as que
  criam e apagam o próprio dado via API: `conferentes`, `fila-conferentes`, `correcao-reabertura`,
  `totp-recuperacao-senha`): sempre roda, sempre passa.
- **Categoria 2 — verificação visual pontual** (`minha-fila`, `distribuicao`, `importar`,
  `central-de-regras`, `distribuicao-v2`, `dashboard` visão conferente, `painel-detalhe-protocolo`,
  `alcada-v3`): precisa de cenário criado à mão; cada arquivo documenta no topo o que precisa
  existir; rodar de novo sem re-semear **vai falhar** e isso não é regressão.
- **Não virar fixture automática de cenário por ora** (custo > benefício sem CI). Se mudar, a
  fixture cria e limpa via API **dentro do próprio teste**, nunca dado deixado por sessão anterior.

## Alternativas consideradas

| Alternativa                                                                  | Prós                       | Contras                                                                             | Por que foi descartada                    |
| ---------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| Fixture automática de cenário pra todo spec                                  | Suíte inteira sempre verde | Custo alto de montar/limpar cenários complexos (status, exceção, tipo desconhecido) | Custo > benefício num projeto sem CI      |
| Bypass de login / token injetado (como `VITE_SKIP_AUTH` no `financas-front`) | Mais rápido                | Não exercita o fluxo real; API rejeita token inventado                              | Aqui o login simples permite o fluxo real |
| Confiar só em `tsc`/build                                                    | Barato                     | Vários bugs reais só apareceram no browser (403 silencioso, `Progress` invisível)   | Insuficiente                              |

## Características impactadas

| Característica   | Impacto    | Justificativa                         |
| ---------------- | ---------- | ------------------------------------- |
| Confiança visual | ✅ Melhora | Tela vista de verdade, nos dois temas |
| Ruído da suíte   | ⚠️ Piora   | Specs pontuais falham fora do cenário |

## Consequências

Todas as lições de locator, relógio, screenshot e dado em [e2e-tests](../patterns/e2e-tests.md).

## Referências

- `playwright.config.ts`, `e2e/`, `.claude/skills/verify-visual`
