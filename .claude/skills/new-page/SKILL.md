---
name: new-page
description: Cria uma tela nova do Dispatch — página em src/pages, widget(s) que compõem entities/features, e o wiring no router (rota + guarda de papel + item de navegação na sidebar). Use quando o usuário pedir "criar a tela de X", "construir a página Y", ou ao implementar um bloco de RFs que ainda é só placeholder (ex.: "constrói a Distribuição de verdade").
---

# new-page

Gera uma tela seguindo o Feature-Sliced Design deste projeto (ver `CLAUDE.md`) e o layout do
protótipo aprovado. `pages/login` + `widgets/app-shell` são a referência de estrutura — leia os
dois inteiros antes de começar.

## Passo 0 — leia o protótipo primeiro, sempre

**Nunca desenhe uma tela de cabeça.** `../dispatch-prototype/Dispatch.dc.html` tem o markup real
(cores, espaçamento em px, texto exato) de cada tela — procure a seção pela variável de estado
que ativa ela (`grep -n "isFila\|isPainel\|isConferentes\|isInteligencia" ...`) e leia o bloco
inteiro antes de traduzir pra Tailwind/shadcn. Os documentos de "opções"
(`Logo - opções.dc.html`, `Tipografia - opções.dc.html`) **não** são a fonte — só o
`Dispatch.dc.html` é o protótipo aprovado (ver `CLAUDE.md`, seção "Design system"). Se a tela
que você precisa não está em nenhum dos dois arquivos do protótipo, pergunte ao dono antes de
inventar layout — não é isso que ele pediu quando disse "fiel ao protótipo".

## Estrutura a criar

1. **`entities/`** e **`features/`** que a tela precisa — se ainda não existirem, gere primeiro
   com as skills `new-entity`/`new-feature`. Uma página não faz chamada HTTP direto; sempre via
   hook de uma entidade ou feature.
2. **`widgets/<nome-do-bloco>/`** — só quando há composição de UI grande o bastante pra
   reaproveitar (um board de 3 colunas, um kanban, uma tabela com filtro). Telas simples podem
   pular o widget e montar tudo direto na página — não force uma camada vazia.
3. **`pages/<rota>/ui/<Nome>Page.tsx`** + **`pages/<rota>/index.ts`** — a página em si, quase
   sem lógica própria, só compõe.

## Wiring (as três coisas, sempre)

1. **`shared/config/routes.ts`** — adicione o caminho em `ROUTES`.
2. **`app/routing/router.tsx`** — adicione a `<Route>`, envolvida em
   `<RequireRole roles={[...]}>` com os papéis certos (confira a seção 3 do documento de
   requisitos — `../dispatch-prototype/Dispatch - Requisitos.dc.html` — pra saber quem acessa
   o quê; não libere pra um papel que o requisito não permite).
3. **`widgets/app-shell/ui/AppShell.tsx`** (`NAV_POR_PAPEL`) — se a tela deve aparecer na
   sidebar, adicione a entrada pro(s) papel(éis) certo(s).

Se a tela precisa aparecer como padrão de algum papel (RF-03), atualize também
`entities/usuario/model/role-home-route.ts`.

## Depois de gerar

1. `npx tsc --noEmit` e `npm run build`.
2. **`verify-visual`** — obrigatório pra tela nova, não opcional. Rode os testes Playwright
   (crie um `e2e/<nome>.spec.ts` se a tela for nova o bastante pra merecer), leia os
   screenshots gerados e confirme visualmente contra o protótipo antes de reportar a tela como
   pronta. Confira nos dois temas.
