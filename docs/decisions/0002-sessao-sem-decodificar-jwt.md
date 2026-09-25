---
name: adr-0002-sessao-sem-decodificar-jwt
description: O front nunca decodifica o JWT — quem está logado vem sempre de resposta HTTP (login ou GET /auth/me), e o cliente HTTP recebe o token por inversão de dependência
metadata:
  type: decision
  status: accepted
---

# ADR-0002: Sessão sem decodificar o JWT, revalidada no boot

> O token é só o que vai no header `Authorization`. "Quem está logado" vem sempre de uma resposta
> HTTP (`POST /auth/login` ou `GET /auth/me`), e o `SessionBoot` revalida contra `/auth/me` antes
> de liberar rotas privadas. O cliente HTTP em `shared` recebe `getToken`/`onUnauthorized` por
> injeção, sem conhecer o Zustand.

## Status

`Accepted` — 2026-08-27 (commit `13c6645`). Decisão tomada junto com a API (ver
`../dispatch-api/CLAUDE.md`, "Login devolve o usuário + GET /auth/me"). Registrado
retroativamente em 2026-09-25.

## Contexto

- SPA autenticada; a sessão (`{ token, usuario }`) precisa sobreviver a F5 — Zustand + `persist`
  em localStorage (`entities/usuario/model/session-store.ts`).
- FSD ([ADR-0001](0001-adotar-feature-sliced-design.md)): `shared` é a camada de baixo e não pode
  importar a store de `entities/usuario`, mas `shared/api/http-client.ts` precisa do token.
- A restrição entre papéis é sempre do servidor (`../CLAUDE.md`); o front só espelha.

## Decisão

1. **O front nunca decodifica o JWT.** A store persiste `{ token, usuario }` como ponto de
   partida otimista; `SessionBoot` (`app/routing`) sempre revalida com `GET /auth/me` antes de
   liberar as rotas privadas.
2. **Inversão de dependência no cliente HTTP**: `shared` expõe
   `configureHttpClient({ getToken, onUnauthorized })`; `app/App.tsx` liga isso à store real na
   inicialização. Mesma ideia do par `AuthProvider`/`ZustandAuthProviderAdapter` do
   `financas-front`, sem a interface — duas funções bastam pra um cliente HTTP só.
3. **Guarda de rota por papel** (`app/routing/require-role.tsx`, RF-03/RNF-04 no front): cada rota
   declara `roles: Papel[]`; a home de cada papel fica em
   `entities/usuario/model/role-home-route.ts` (`Record<Papel, string>`). Desde 2026-09-15 a
   sessão tem `papeis: Papel[]` e a rota libera se **qualquer** papel bater
   (`usuario.papeis.some(...)`); `papeis[0]` é sempre o `Usuario.Papel` real e decide a home.
   Papel novo (ex.: "Subscritor", ainda não definido nos requisitos) = valor novo em `Papel` +
   linha em `roleHomeRoute` + rota — nada na guarda muda.

## Alternativas consideradas

| Alternativa                                                  | Prós                            | Contras                                                         | Por que foi descartada                                 |
| ------------------------------------------------------------ | ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Decodificar o JWT no front pra saber usuário/papel           | Sem round-trip no boot          | Duas fontes da verdade; claims ficam velhas até o token expirar | Decidido com a API: identidade sempre de resposta HTTP |
| `shared/api` importar a store de sessão direto               | Menos indireção                 | Viola a regra de camadas do FSD                                 | Quebraria a ADR-0001                                   |
| Interface `AuthProvider` + adapter (padrão `financas-front`) | Troca de implementação testável | Cerimônia pra um cliente HTTP só                                | Duas funções injetadas resolvem o mesmo                |

## Características impactadas

| Característica            | Impacto    | Justificativa                              |
| ------------------------- | ---------- | ------------------------------------------ |
| Segurança/consistência    | ✅ Melhora | Papel e identidade vêm do servidor         |
| Latência no boot          | ⚠️ Piora   | Um `GET /auth/me` antes das rotas privadas |
| Acoplamento entre camadas | ✅ Melhora | `shared` não conhece Zustand               |

## Consequências

**Positivas** — trocar de usuário não depende de ler token; `/auth/me` corrige o que a tela sabe
sobre a pessoa (menu reage a papel novo).

**Negativas** — o **token** continua com as claims da emissão: papel novo dado a uma conta logada
só vale nos endpoints depois de deslogar/logar (achado real em 2026-09-15, ver
[historico](../historico.md) "Uma conta com os dois papéis"). O `SessionBoot` só bloqueia
enquanto a query está `isLoading` — os filhos renderizam com a store ainda velha por um instante,
o que exigiu a migração versionada do [ADR-0017](0017-sessao-persistida-versionada.md).

**Riscos** — cache do TanStack Query sem escopo por usuário vazou sessão entre logins
(2026-08-27): resolvido com `queryClient.clear()` no logout, no login e no handler de 401, com
regressão em `e2e/session-isolation.spec.ts`. Qualquer 401 derruba a sessão — endpoints anônimos
que devolvem 401 como resultado de negócio usam o opt-out `ignorarSessaoEncerrada` (ver
[dados-e-mutations](../patterns/dados-e-mutations.md)).

## Referências

- `entities/usuario/model/session-store.ts`, `app/routing/session-boot.tsx`, `require-role.tsx`
- [ADR-0017](0017-sessao-persistida-versionada.md)
