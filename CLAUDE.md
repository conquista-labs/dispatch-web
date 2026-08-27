# Dispatch Web

> Panorama geral do projeto Dispatch (os três repositórios, papéis do sistema) está em `../CLAUDE.md`.
> Documento de requisitos e wireframes vivem em `../dispatch-prototype/` — releia-os antes de
> construir qualquer tela nova. Os wireframes mostram várias explorações por tela (rotuladas
> `1a`, `1b`, `1c`...); ainda não há decisão fechada de qual variante seguir por tela — decidir
> isso é parte do trabalho de cada tela, não algo pra inventar aqui.

Front-end do Dispatch — consome a API em `../dispatch-api`.

## Stack

- **Vite + React 19 + TypeScript**, sem SSR (SPA autenticada atrás de login — não há ganho de
  SEO/first-paint que justifique Next.js aqui).
- **TanStack Query** para estado de servidor (cache, refetch, mutations) — não existe uma
  camada de "usecase" própria por cima disso; os hooks de query/mutation *são* a camada de
  acesso a dados.
- **Zustand + `persist`** para sessão (token + usuário), sobrevive a F5 via localStorage.
- **React Router v7** para rotas.
- **Tailwind CSS v4** (`@tailwindcss/vite`) para estilos. Kit de componentes ainda mínimo
  (`shared/ui/Button`) — Radix/shadcn entram quando as telas reais pedirem componentes mais
  ricos (select, dialog, tabela).
- **Axios** com um cliente HTTP único (`shared/api/http-client.ts`).

## Arquitetura: Feature-Sliced Design

Decisão tomada com o dono depois de comparar duas referências: o `financas-front` (projeto
irmão em `../../nossa-grana/financas-front`, que porta Clean Architecture de back pra front —
`domain/data/infra/presentation/main`, com uma interface + implementação + factory + hook por
endpoint) e [Feature-Sliced Design](https://feature-sliced.design/). Optamos por FSD: ele dá a
mesma disciplina de dependência unidirecional que o back já tem (`Domain` nunca conhece
`Application`; aqui, camada nenhuma conhece a de cima dela), mas nativa de front e sem a
cerimônia de 4 arquivos por endpoint — que não se paga neste projeto, já que a regra de
negócio inteira mora no back (motor de distribuição, alçada, prazo); o front só chama endpoint
e renderiza.

Camadas, de cima pra baixo (uma camada só importa das que estão abaixo dela — nunca do lado,
nunca de cima):

```
app/          composition root: providers, roteamento, guarda de papel, wiring do http client
pages/        uma pasta por rota — compõem widgets, quase sem lógica própria
widgets/      blocos de UI grandes, compostos de features + entities (ex.: o board de Minha fila)
features/     um verbo por slice — mapeia direto nos casos de uso do back (PegarProtocolo,
              AplicarSugestao, CriarRegraAlcada...). Mesmo nome dos dois lados de propósito.
entities/     os substantivos do domínio (Protocolo, Conferente, Equipe...) — leitura básica
              (GET) e o tipo, não ações
shared/       infraestrutura sem regra de negócio: cliente HTTP, query client, config de rota,
              kit de UI
```

**Por que a sessão fica em `entities/usuario` e não em `shared`**: `shared` é a camada mais de
baixo, não pode importar de `entities`. Mas o cliente HTTP (`shared/api/http-client.ts`) precisa
do token pra anexar no header — resolvido com inversão de dependência: `shared` expõe
`configureHttpClient({ getToken, onUnauthorized })` (dois pontos de extensão, sem saber de
Zustand), e `app/App.tsx` é quem liga isso à store de verdade, na inicialização. Mesma ideia do
par `AuthProvider`/`ZustandAuthProviderAdapter` do financas-front, sem a interface — não
precisava de mais cerimônia do que duas funções pra um cliente HTTP só.

## Autenticação

Decisão tomada junto com a API (ver `../dispatch-api/CLAUDE.md`, seção "Login devolve o
usuário + GET /auth/me"): **o front nunca decodifica o JWT**. Token é só o que vai no header
`Authorization`; "quem está logado" vem sempre de uma resposta HTTP (`POST /auth/login` no
momento do login, `GET /auth/me` num F5/aba nova). `entities/usuario/model/session-store.ts`
persiste `{ token, usuario }`, mas trata isso como ponto de partida otimista — `SessionBoot`
(`app/routing`) sempre revalida contra `GET /auth/me` antes de liberar as rotas privadas.

**Guarda de rota por papel** (`app/routing/require-role.tsx`) — RF-03/RNF-04 no front (a
garantia de verdade continua sendo o servidor). Cada rota declara `roles: Papel[]`; a home de
cada papel fica em `entities/usuario/model/role-home-route.ts` (`Record<Papel, string>`).
Quando "Subscritor" existir no back, entra como um valor novo em `Papel` (`entities/usuario`)
mais uma linha em `roleHomeRoute` mais uma rota nova com `roles: ['Subscritor']` — nada na
guarda em si muda.

## CORS

A API precisou ganhar `AddCors`/`UseCors` (só em Development, origem `http://localhost:5173`)
pra aceitar chamada do navegador — nenhum teste anterior contra a API tinha esbarrado nisso
porque `curl`/Postman não fazem preflight, só o browser faz. Documentado também no
`CLAUDE.md` do `dispatch-api`.

## Comandos

```
npm run dev      # sobe o Vite dev server (porta 5173)
npm run build    # tsc -b && vite build
```

## Estado atual

Scaffold feito: FSD completo (`app/pages/widgets/features/entities/shared`), autenticação
ponta a ponta (login, `/auth/me` no boot, guarda de rota por papel, logout), duas páginas
placeholder (`Distribuição` e `Minha fila`) só provando que rota + guarda funcionam — nenhuma
tela de verdade construída ainda. Verificado: `tsc --noEmit` limpo, `npm run build` limpo,
Vite dev server servindo e resolvendo todos os módulos sem erro, e o contrato de auth
(CORS + login + `/auth/me`) testado ponta a ponta contra a API local. **Não testado num
navegador de verdade** (sem ferramenta de automação de browser disponível na sessão que
gerou este scaffold) — vale um `npm run dev` manual antes de considerar essa base 100% ok.

Não existe kit de UI real (Radix/shadcn), nem testes (vitest), nem lint (eslint) configurados
ainda — ficou fora deste primeiro corte pra focar em arquitetura + auth. Próximo passo natural
é a primeira tela de verdade (RF-19 a RF-24, Minha fila, é a mais simples das duas — bom
candidato pra validar o padrão de slice antes de encarar a Distribuição).
