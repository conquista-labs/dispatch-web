---
name: adr-0021-global-setup-garante-contas-de-login
description: Um globalSetup do Playwright chama POST /dev/seed-e2e uma vez antes da suíte pra garantir as contas fixas de login; dado de cenário continua responsabilidade de cada spec
metadata:
  type: decision
  status: accepted
---

# ADR-0021: `globalSetup` do Playwright garante as contas de login

> `playwright.config.ts` roda `e2e/global-setup.ts` uma vez, que chama `POST /dev/seed-e2e`
> (endpoint dev-only da API) e cria/reseta as 3 contas fixas. A suíte deixa de depender de "o que
> já tinha no banco" pra logar.

## Status

`Accepted` — 2026-09-15 (commit `49739b3`). Complementa o [ADR-0020](0020-playwright-com-duas-categorias-de-spec.md).
Registrado retroativamente em 2026-09-25.

## Contexto

Um clone de produção pro Postgres local (pra analisar a Central de Regras) derrubou a suíte e2e
inteira: quase todo spec loga com `distribuidora@cartorio.com`, `conferente-rf27@cartorio.com` e
`conferente-visual@cartorio.com`, que só existiam porque alguém as criou à mão. Critério do dono:
**"um bom teste não depende de dado local, a não ser que o dado seja criado pelo teste e depois
apagado"**.

## Decisão

Duas categorias de dependência de dado, tratadas diferente:

1. **Identidade de login** (as 3 contas) → `globalSetup` + `POST /dev/seed-e2e`: cria quem não
   existe, reseta senha/estado de quem existe. Se a API não estiver de pé (ou não estiver em
   Development), falha cedo com mensagem clara.
2. **Dado de cenário** (protocolo, conferente extra, equipe, regra) → continua responsabilidade de
   cada spec, criando e apagando via API. O `globalSetup` não tenta resolver isso.

## Alternativas consideradas

| Alternativa                                      | Prós                | Contras                                                       | Por que foi descartada                              |
| ------------------------------------------------ | ------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| Contas criadas à mão (estado anterior)           | Nada a manter       | Qualquer reset/clone do banco quebra tudo, de formas confusas | Motivou a mudança                                   |
| Cada spec criar a própria conta de login         | Isolamento total    | Muito boilerplate; a conta combo tem vínculos específicos     | Identidade é chão comum, não dado do teste          |
| `globalSetup` também montar os cenários pontuais | Suíte inteira verde | Escopo bem maior                                              | Fora de escopo por decisão explícita (ver ADR-0020) |

## Características impactadas

| Característica        | Impacto    | Justificativa                                             |
| --------------------- | ---------- | --------------------------------------------------------- |
| Reprodutibilidade     | ✅ Melhora | Mesmo chão de login em banco zerado, seed antigo ou clone |
| Acoplamento com a API | ⚠️ Piora   | Depende de um endpoint dev-only                           |

## Consequências

Validado rodando os 21 specs contra o clone anonimizado: os 4 de regressão + os 3 que só dependem
de login passaram; os pontuais falharam como esperado. A conta `distribuidora@cartorio.com` é
**combo** (Distribuidora + Conferente) — locators por texto precisam de escopo (ver
[e2e-tests](../patterns/e2e-tests.md)).

## Referências

- `e2e/global-setup.ts`, `playwright.config.ts`, `../dispatch-api/CLAUDE.md` (`/dev/seed-e2e`)
