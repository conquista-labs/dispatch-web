---
name: adr-0017-sessao-persistida-versionada
description: A sessão persistida (Zustand persist) tem version + migrate; mudança de formato do usuário migra na hidratação em vez de exigir logout
metadata:
  type: decision
  status: accepted
---

# ADR-0017: Sessão persistida versionada, com migração na hidratação

> `session-store.ts` declara `version` no `persist` do Zustand e uma função `migrate`
> (`migrarSessao`, pura e testada). Quando o formato de `usuario` muda, a sessão antiga é migrada
> antes de qualquer componente renderizar.

## Status

`Accepted` — 2026-09-15 (commit `512d876`; `migrarSessao` extraída e testada em 2026-09-22,
commit `0538684`). Registrado retroativamente em 2026-09-25.

## Contexto

Quando `Usuario.papel: Papel` virou `Usuario.papeis: Papel[]` (conta com os dois papéis), quem já
estava logado antes do deploy tinha no localStorage `usuario.papel` sem `papeis`. `AppShell`,
`DashboardPage` e `RequireRole` leem `usuario.papeis.includes(...)` direto → `Uncaught TypeError`
em produção, tela inteira quebrada. O `GET /auth/me` do `SessionBoot`
([ADR-0002](0002-sessao-sem-decodificar-jwt.md)) não salvava: ele só bloqueia enquanto
`isLoading`; quando a resposta chega os filhos já renderizam com a store velha (o `setSession`
roda no `useEffect` seguinte).

## Decisão

`persist` com `version: 1` + `migrate`: sessão na versão `0` (implícita em qualquer sessão salva
antes) com `papel` e sem `papeis` vira `{ ..., papeis: [papel] }` na hidratação. Mudança futura de
formato persistido = incrementar `version` e acrescentar o passo em `migrarSessao`, com teste.

## Alternativas consideradas

| Alternativa                                         | Prós                             | Contras                                                    | Por que foi descartada                          |
| --------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Pedir pra todo mundo deslogar/logar                 | Zero código ("resolvia" na hora) | Todo usuário com sessão antiga vê a tela quebrada primeiro | Ninguém deveria precisar fazer isso manualmente |
| Confiar no `/auth/me` do `SessionBoot` pra corrigir | Já existe                        | Timing: filhos renderizam antes do `setSession`            | Não evita o crash                               |

## Características impactadas

| Característica     | Impacto    | Justificativa                                                     |
| ------------------ | ---------- | ----------------------------------------------------------------- |
| Robustez em deploy | ✅ Melhora | Sessões antigas não quebram                                       |
| Testabilidade      | ✅ Melhora | `migrarSessao` testada como função pura (`session-store.test.ts`) |

## Consequências

Testado simulando o cenário exato (localStorage `{ usuario: { papel: 'Distribuidora' },
version: 0 }` + token real). Skill `verify-visual` usa o formato `{"state":{...},"version":N}` ao
pré-popular o localStorage — mantenha a versão em dia lá.

## Referências

- `src/entities/usuario/model/session-store.ts` (+ `.test.ts`)
- [docs/historico.md](../historico.md) — "Uma conta com os dois papéis"
