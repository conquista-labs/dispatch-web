# Dispatch Web

Front-end do Dispatch (distribuição e conferência de protocolos de cartório) — SPA que consome a
API em `../dispatch-api`.

> Panorama do projeto (os três repositórios, papéis distribuidora/conferente) em `../CLAUDE.md`.
> Requisitos e protótipo aprovado em `../dispatch-prototype/` — `Dispatch - Requisitos.dc.html`
> (RF/RNF) e `Dispatch v2.dc.html` (o protótipo; código e histórico citam o nome antigo
> `Dispatch.dc.html`). **Releia os dois antes de construir ou mudar qualquer tela.**

**Este arquivo é um índice.** Cada linha diz _quando_ ler um documento; o conteúdo mora em
`docs/`. Histórico de entregas: `docs/historico.md` — **não acrescente seções de changelog aqui**;
decisão nova vira ADR (skill `/web-adr`), lição nova vai pro pattern doc ou pra skill.

## Stack

- **Vite + React 19 + TypeScript**, SPA sem SSR (app autenticado; sem ganho de SEO/first-paint que
  justifique Next.js).
- **TanStack Query** pra estado de servidor — os hooks de query/mutation _são_ a camada de acesso a
  dados (sem "usecase" por cima).
- **Zustand + `persist`** pra sessão, tema e sidebar (localStorage, versionado).
- **React Router v7**; **Axios** com um cliente único (`shared/api/http-client.ts`).
- **Tailwind CSS v4** + **shadcn/ui** (`radix-nova`, pacote unificado `radix-ui`) — primitivos em
  `shared/ui`; o CLI gera numa quarentena (`shared/ui/generated/`) e o arquivo é copiado à mão
  (skill `add-shadcn-component`).
- Testes: **Vitest + RTL** (unidade/componente, cobertura com ratchet) e **Playwright** (E2E e
  verificação visual). Lint **oxlint**, formatação **Prettier** (+ plugin Tailwind), pre-commit
  **husky + lint-staged**.

## Arquitetura — Feature-Sliced Design

```
app/       composition root: providers, roteamento, guarda de papel, wiring do http client
pages/     uma pasta por rota — compõem widgets, quase sem lógica
widgets/   blocos de UI grandes (boards, painéis, wizard)
features/  um verbo por slice = um caso de uso do back (PegarProtocolo, CriarRegraAlcada…)
entities/  substantivos do domínio: tipo + leitura (GET), sem ações
shared/    infraestrutura sem regra de negócio: http, query client, rotas, kit de UI
```

Uma camada só importa das de baixo; entre widgets, só pelo barrel. A regra de negócio inteira mora
no back — o front chama endpoint e renderiza. Por quê e alternativas:
[ADR-0001](docs/decisions/0001-adotar-feature-sliced-design.md). Sessão, JWT e guarda de papel:
[ADR-0002](docs/decisions/0002-sessao-sem-decodificar-jwt.md).

## Onde está cada coisa

### Pendências e histórico

- `docs/gaps-requisitos.md` — o que ainda falta em relação aos RF/RNF (§N estáveis, com evidência).
  **Leia antes de pegar um RF novo** e antes de dizer que algo está "pronto".
- `docs/historico.md` — narrativa cronológica das entregas (o que foi feito, arquivos, como foi
  verificado). Consulta: quando precisar saber _por que_ uma tela está como está.

### Padrões (`docs/patterns/`) — leia quando for fazer a coisa

- `design-system.md` — **antes de escolher cor, fonte, token ou primitivo** de `shared/ui`; tema
  claro/escuro, logo, badges, scrollbar/cursor globais.
- `tailwind.md` — quando um componente vira parede de classe, ou uma classe "não faz efeito"
  (`twMerge`, `classNames` do Calendar, dev server).
- `shadcn-gotchas.md` — **antes de todo `npx shadcn add`** e quando um componente gerado parecer
  "sem efeito" (imports quebrados, pacote fantasma `cn`, `Progress`, Popover em Dialog…).
- `verificacao-com-prototipo.md` — **antes de qualquer trabalho de fidelidade**: abrir o `.dc.html`
  via `file://` no Playwright, desconfiar de export velho, confirmar por markup e medição.
- `responsive.md` — ao criar/alterar grid, tira de pills, tabela ou cabeçalho (RNF-13, 760px).
- `lists-and-long-content.md` — lista que cresce, "+N protocolos", paginação, nomes longos (RNF-10).
- `dados-e-mutations.md` — ao escrever query/mutation, tratar erro de API, ou quando a tela não
  atualiza/mostra dado de outra sessão.
- `codigo-react.md` — ao escrever/revisar componente ou hook; correções de lint já usadas.
- `testing-strategy.md` — o que testar (e o que vai pro back), onde o teste vive, ratchet, setup RTL.
- `e2e-tests.md` — ao escrever/consertar spec Playwright ou interpretar uma falha de e2e.
- `deploy.md` — ao subir pra produção ou mexer em URL/CORS.

### Decisões (`docs/decisions/`) — ADRs, template em `TEMPLATE.md`

| ADR                                                                                        | Decisão                                                                                               |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [0001](docs/decisions/0001-adotar-feature-sliced-design.md)                                | FSD em vez da Clean Architecture de front do `financas-front`                                         |
| [0002](docs/decisions/0002-sessao-sem-decodificar-jwt.md)                                  | Front nunca decodifica JWT; `/auth/me` revalida; cliente HTTP por injeção                             |
| [0003](docs/decisions/0003-prototipo-aprovado-como-fonte-de-design.md)                     | Protótipo aprovado manda no design; tokens zinc nos nomes do shadcn                                   |
| [0004](docs/decisions/0004-cva-e-primitivos-contra-parede-de-classes.md)                   | `cva` + primitivos na 3ª repetição contra parede de `className`                                       |
| [0005](docs/decisions/0005-lazy-loading-por-pagina.md)                                     | Lazy loading por página                                                                               |
| [0006](docs/decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)                     | Back manda ids/enums crus; front resolve nomes e não inventa dado                                     |
| [0007](docs/decisions/0007-filtros-de-protocolo-no-cliente.md)                             | Filtros 100% client-side via predicado (eixo Prazo substituído pelo 0008)                             |
| [0008](docs/decisions/0008-eixo-prazo-como-alternador-urgente.md)                          | Eixo Prazo = alternador "urgente"; painel de Filtros com Combo                                        |
| [0009](docs/decisions/0009-manter-atribuicao-manual-de-excecao.md)                         | Resolver exceção exige escolha manual, não auto-atribuir                                              |
| [0010](docs/decisions/0010-divergencias-deliberadas-do-prototipo.md)                       | Tabela das divergências deliberadas do protótipo — **confira antes de "corrigir" algo pro protótipo** |
| [0011](docs/decisions/0011-adotar-vitest.md)                                               | Vitest, config própria, testes colados (ambiente substituído pelo 0012)                               |
| [0012](docs/decisions/0012-cobertura-com-ratchet-e-rtl.md)                                 | Cobertura com ratchet + RTL em jsdom, sem meta fixa                                                   |
| [0013](docs/decisions/0013-oxlint-por-categorias-e-pre-commit.md)                          | oxlint por categorias, 6 regras desligadas, pre-commit sem `--max-warnings 0`                         |
| [0014](docs/decisions/0014-prettier-com-plugin-tailwind.md)                                | Prettier (sem `;`, aspas simples, 120) + plugin Tailwind                                              |
| [0015](docs/decisions/0015-breakpoint-mobile-760.md)                                       | Breakpoint único de 760px via `@theme`                                                                |
| [0016](docs/decisions/0016-badges-proprios-e-variante-fonte-no-chip.md)                    | Badges próprios / variante `fonte` em vez de mudar o default do `Chip`                                |
| [0017](docs/decisions/0017-sessao-persistida-versionada.md)                                | Sessão persistida com `version` + `migrate`                                                           |
| [0018](docs/decisions/0018-loading-com-spinner-unificado.md)                               | Loading unificado com spinner, não skeleton                                                           |
| [0019](docs/decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md) | Listas longas: busca + rolagem no cliente; paginação no servidor só em Tipos de ato                   |
| [0020](docs/decisions/0020-playwright-com-duas-categorias-de-spec.md)                      | Playwright com duas categorias de spec, sem fixture automática de cenário                             |
| [0021](docs/decisions/0021-global-setup-garante-contas-de-login.md)                        | `globalSetup` garante as contas fixas de login                                                        |
| [0022](docs/decisions/0022-deploy-manual-no-netlify-com-build-remoto.md)                   | Deploy manual no Netlify com build remoto                                                             |

## Skills do projeto (`.claude/skills/`)

Prefira a skill a re-derivar o fluxo.

- **`new-entity`** — slice em `entities/` (tipo + leitura) ao consumir um GET novo.
- **`new-feature`** — slice em `features/` (mutation) ao ligar um botão a um endpoint de escrita.
- **`new-page`** — tela nova: página + widgets + rota + guarda de papel + item de nav.
- **`add-shadcn-component`** — instalar um componente shadcn no lugar certo, com a checagem das
  armadilhas.
- **`verify-visual`** — conferir tela no Playwright, nos dois temas, com login real. **Obrigatória
  depois de qualquer mudança de tela.**
- **`web-testing-strategy`** — decidir que teste uma mudança pede e onde ele vive.
- **`web-gate`** — cadeia de verificação completa no fim da tarefa (check → build → e2e).
- **`web-commit`** — da árvore verificada pra commits no `main` (um por assunto, na voz do repo);
  push só quando pedido.
- **`web-adr`** — registrar uma decisão entre alternativas reais em `docs/decisions/`.
- **`shadcn`** — skill oficial do shadcn/ui (vendorizada em `.agents/skills/shadcn`), só consulta
  (docs, registro, MCP em `.mcp.json`); o passo de escrever arquivo é sempre o `add-shadcn-component`.

Agente em `.claude/agents/`: **`fsd-reviewer`** — revisa um diff atrás de violação de fronteira FSD
(e de regra de negócio recriada no front); só lê. Hooks em `.claude/settings.json`: guarda contra
git destrutivo/fora do Dispatch, prettier no arquivo editado, log de uso de skill.

## Comandos

```
npm run dev            # Vite dev server (porta 5173)
npm run build          # tsc -b && vite build
npm run check          # tsc -b && oxlint && vitest run --coverage  (tier 1 do gate)
npm test               # vitest run (sem cobertura); test:watch / test:coverage
npm run lint           # oxlint
npm run format         # prettier --write . ; format:check pra só conferir
npm run e2e            # Playwright (exige a API local de pé); e2e:ui pra depurar
```

## Deploy

Site Netlify `lab-dispatch-web` (`https://lab-dispatch-web.netlify.app`); API no Render. Sempre
`netlify deploy --prod --build` — `VITE_API_URL` é variável de **build** configurada no Netlify, e
`vite build` local não lê `.env.development` (bundle sairia com a URL `undefined`). Renomear o site
muda a origem CORS: atualize `Cors__AllowedOrigin` no Render. Detalhes em `docs/patterns/deploy.md`.

## Armadilhas que toda sessão precisa saber

- **O `.dc.html` pode estar desatualizado e ler markup engana** — abra via `file://` no Playwright
  e compare lado a lado; releia antes de cada trabalho de fidelidade
  ([verificacao-com-prototipo](docs/patterns/verificacao-com-prototipo.md)).
- **Não invente dado nem regra de negócio no front** — o que o back não calcula não aparece; regra
  de distribuição/alçada/prazo testa no back ([ADR-0006](docs/decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)).
- **Todo `shadcn add` pede revisão do arquivo gerado** (`from "cn"` + pacote fantasma `cn`,
  `next-themes`, prop não repassada) ([shadcn-gotchas](docs/patterns/shadcn-gotchas.md)).
- **Teste logado como o papel de menor privilégio** — 403 em query auxiliar não quebra layout, só o
  resultado ([e2e-tests](docs/patterns/e2e-tests.md)).
- **Mutation invalida tudo que mudou**, inclusive o detalhe aberto; refetch lento → `setQueryData`
  ([dados-e-mutations](docs/patterns/dados-e-mutations.md)).
- **Mudou formato persistido no localStorage? `version` + `migrate` antes do deploy**
  ([ADR-0017](docs/decisions/0017-sessao-persistida-versionada.md)).
- **Nunca `<input type="date|time">`/`<select>` nativo** (RNF-07) e seletor com busca em lista que
  cresce (RNF-11) ([design-system](docs/patterns/design-system.md)).
- **Mexeu em `AppShell`/nav? Rode a suíte e2e inteira** — rótulo de menu já quebrou specs em
  silêncio ([e2e-tests](docs/patterns/e2e-tests.md)).
- **Classe Tailwind nova sem efeito num dev server antigo → reinicie o Vite** antes de desconfiar
  do código ([tailwind](docs/patterns/tailwind.md)).
- **Nunca abaixe o threshold de cobertura à mão**; o diff do ratchet vai no commit
  ([testing-strategy](docs/patterns/testing-strategy.md)).
