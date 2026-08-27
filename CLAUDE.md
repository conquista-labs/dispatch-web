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
- **Tailwind CSS v4** + **shadcn/ui** (estilo `radix-nova`) para componentes — `components.json`
  aponta os aliases pra dentro de `shared/ui`/`shared/lib`, então `npx shadcn add <componente>`
  já cai no lugar certo do FSD.
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

## Design system: fonte da verdade é o protótipo aprovado

`../dispatch-prototype/Dispatch.dc.html` — não os documentos "opções" (`Logo - opções.dc.html`,
`Tipografia - opções.dc.html`) — é o que decide cor, tipografia, logo e espaçamento. Os
documentos de "opções" são explorações com uma aposta do designer no fim ("diga o número e eu
troco no sistema"), mas o `Dispatch.dc.html` é o protótipo que a seção 6 do documento de
requisitos chama de "aprovado": ele já tem a decisão tomada, embutida no CSS/markup de verdade
(inclusive contrariando a aposta da Tipografia — o protótipo aprovado ficou com Instrument Sans,
não IBM Plex). Sempre que os dois divergirem, o `Dispatch.dc.html` vale mais.

- **Cores**: paleta neutra do protótipo bate exatamente com a escala `zinc` do Tailwind
  (`--text:#09090b` = zinc-950, `--ink:#18181b` = zinc-900, `--muted:#a1a1aa` = zinc-400...) —
  descoberta feita comparando os hex, não documentada em lugar nenhum do protótipo. Os tokens
  semânticos (`--bg`, `--surface`, `--border`, `--primary`...) viraram os nomes padrão do
  shadcn em `src/app/styles/index.css` (`--background`, `--card`, `--border`, `--primary`...)
  pra usar os componentes do shadcn sem alteração; os 4 tons extras de cinza que o protótipo
  usa e o shadcn não prevê (`--text-2` a `--text-5`) e as 4 faixas do semáforo (RF-14, seção 5:
  ok/atenção/crítico/vencido — `--ok-*`/`--warn-*`/`--crit-*`/`--bad-*`) entram como tokens
  extras, registrados em `@theme inline` pra gerar classe Tailwind (`text-text-2`, `bg-ok-bg`,
  etc.). Modo escuro é `html[data-tema="dark"]` no protótipo; aqui virou `.dark` no `<html>`
  (convenção do shadcn/Tailwind v4) — só a mecânica muda, os valores de cor são os mesmos.
- **Tipografia**: Instrument Sans (texto) + JetBrains Mono (número de protocolo, prazo, score —
  qualquer dado tabular/numérico) — pacotes `@fontsource-variable/*` (self-hosted, sem
  dependência de Google Fonts em runtime).
- **Logo**: a ampulheta (`src/shared/ui/logo.tsx`) — opção "1d" de `Logo - opções.dc.html`, a
  que de fato foi construída no protótipo aprovado (dois triângulos empilhados: o de cima mais
  forte, o de baixo mais apagado — a mesma linguagem do semáforo de prazo). Tem duas variantes
  porque o protótipo usa duas: `on-light` (crachá escuro, cores via token — segue o tema, usada
  na sidebar) e `on-dark-fixed` (crachá claro, cores fixas em hex — o painel de login é sempre
  escuro, não acompanha o tema do app, então não pode depender de `var(--background)`).
- **RF-04** (alternador de tema): `shared/lib/theme-store.ts` (Zustand + `persist`), aplica a
  classe `.dark` direto no `<html>`. Persistência é por navegador (localStorage) — o back não
  tem campo de preferência de tema no `Usuario` hoje, então "por usuário" foi interpretado como
  "por sessão de navegador daquele usuário", não sincronizado entre dispositivos. Um script
  inline em `index.html` aplica o tema salvo antes do primeiro paint, pra não piscar o tema
  errado enquanto o React/Zustand ainda não montaram.

### Duas armadilhas do `shadcn add` neste projeto (Vite + alias customizado)

1. **A CLI não resolve `@/*` sem `baseUrl` no `tsconfig.json` da raiz.** `tsconfig.app.json`
   sozinho (com `paths` mas sem `baseUrl`, que o TS 6+ deprecia) não bastava — a CLI criava uma
   pasta `@` literal em vez de resolver pra `src/`. Precisou de `baseUrl`/`paths` duplicado
   também no `tsconfig.json` da raiz (com `ignoreDeprecations: "6.0"` pra silenciar o aviso do
   `tsc`), só pra ferramentas como essa que não seguem `references` de projeto.
2. **`components.json` por padrão aponta pra `@/components/ui` e `@/lib`, fora da árvore FSD.**
   Ajustado pra `"components"`/`"ui"` → `@/shared/ui` e `"utils"`/`"lib"` → `@/shared/lib`, já
   na inicialização — sem isso, cada `shadcn add` ia espalhar pasta nova fora de
   `app/pages/widgets/features/entities/shared`.

Lição à parte, não específica do shadcn: **macOS tem filesystem case-insensitive por padrão** —
renomear `Button.tsx` pra `button.tsx` (só a caixa) via `mv` direto confunde o índice do git
(fica achando que o arquivo ainda é o antigo, com outro conteúdo) e pode até apagar o arquivo
sem aviso se um `rm` dos dois nomes rodar em sequência. Renomeio de caixa precisa passar por um
nome intermediário (`git mv x.tsx x-tmp.tsx && git mv x-tmp.tsx X.tsx`).

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
ponta a ponta (login, `/auth/me` no boot, guarda de rota por papel, logout), shadcn/ui
inicializado com os aliases certos, tema (cores, tipografia, logo, claro/escuro) copiado do
protótipo aprovado. Duas telas com o chrome fiel ao protótipo: **Login** (split-screen: painel
de marca sempre escuro + formulário) e a **sidebar** (`widgets/app-shell`, nav por papel,
sessão + tema + sair). `Distribuição` e `Minha fila` em si continuam placeholder — só o
cabeçalho no padrão certo, conteúdo real (os boards/kanbans) ainda não construído.

Verificado: `tsc --noEmit` limpo, `npm run build` limpo (fontes e CSS gerados corretamente,
classes utilitárias customizadas — `text-text-2`, `bg-ok-bg` etc. — conferidas no CSS final),
Vite dev server servindo tudo sem erro, contrato de auth (CORS + login + `/auth/me`) testado
ponta a ponta contra a API local. **Não testado visualmente num navegador de verdade** — sem
ferramenta de automação de browser disponível nas sessões que construíram isso até aqui. Vale
um `npm run dev` manual (com a API rodando em `:5245`) antes de considerar o layout 100%
fiel — a tradução dos valores do protótipo (px exatos, cores, espaçamento) pra Tailwind foi
feita por leitura do HTML/CSS do protótipo, não por comparação visual lado a lado.

Ainda não existem testes (vitest) nem lint (eslint) configurados — ficou fora deste corte pra
focar em arquitetura + auth + design system. Próximo passo natural é a primeira tela de
verdade com conteúdo real (RF-19 a RF-24, Minha fila — mais simples que Distribuição, bom
candidato pra validar o padrão de slice + os componentes de card/prazo antes da tela maior). O
markup de referência de cada tela (cores, espaçamento, texto exato) está em
`../dispatch-prototype/Dispatch.dc.html` — sempre ler a seção correspondente antes de montar
uma tela nova, não improvisar layout.
