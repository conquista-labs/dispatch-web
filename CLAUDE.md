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
  camada de "usecase" própria por cima disso; os hooks de query/mutation _são_ a camada de
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

## Tailwind: evitando className gigante

Preocupação real do dono (já vivida no `financas-front` também): Tailwind puro em componente
grande vira uma parede de classe ilegível. Três respostas concretas, aplicadas a partir da
tela Minha fila:

1. **`class-variance-authority` (`cva`, já instalado — é o que o `Button` do shadcn usa) pra
   qualquer componente com variante.** Em vez de objeto de classe + template literal na mão
   (`ACAO_CLASSES[variante]`), a tabela variante→classe fica declarada num lugar só, com nome
   (`shared/ui/chip.tsx`, `shared/ui/surface-card.tsx`) — mesmo padrão que o shadcn já
   estabeleceu, não é convenção nova.
2. **Primitivos pequenos em `shared/ui` pra combinação de classe que se repete entre telas.**
   `Chip` (pílula de prazo/status — RF-14/RF-19/RF-24) e `SurfaceCard` (o "card" específico do
   protótipo: radius 10px, borda, sombra leve — não é o `Card` do shadcn, que é mais pesado/
   opinativo e brigaria com o visual do protótipo em vez de simplificar) nasceram porque a
   mesma pilha de classes aparecia em 3 componentes diferentes de Minha fila. Regra prática: se
   uma combinação de classe repete numa terceira vez, vira componente em `shared/ui`, não mais
   uma cópia colada.
3. **Reaproveitar o `Button` do shadcn em vez de `<button>` cru com classe na mão** sempre que o
   visual bater com uma variante existente (`default`/`outline`/`destructive`/`ghost`) — o
   token `--destructive` já é `--bad-fg` do protótipo (ver seção de cores acima), então
   `variant="destructive"` já sai com a cor certa sem precisar escrever nada a mais.

O que isso não resolve sozinho: valores de px "quebrados" do protótipo (`13.5px`, `11.5px`...)
continuam como valor arbitrário (`text-[13.5px]`) — não corresponde a nenhum degrau do
`text-*` padrão do Tailwind nem vale a pena criar um token novo pra cada um. Aceito como custo
de fidelidade pixel-perfect ao protótipo; se começar a incomodar, o próximo passo seria
`prettier-plugin-tailwindcss` (ordena a classe, não reduz a lista) — ainda não configurado.

## CORS

A API precisou ganhar `AddCors`/`UseCors` (só em Development, origem `http://localhost:5173`)
pra aceitar chamada do navegador — nenhum teste anterior contra a API tinha esbarrado nisso
porque `curl`/Postman não fazem preflight, só o browser faz. Documentado também no
`CLAUDE.md` do `dispatch-api`.

## Skills do projeto

Em `.claude/skills/`, pra fluxos recorrentes deste repositório:

- **`new-entity`** — nova slice em `entities/` (substantivo do domínio: leitura + tipo).
- **`new-feature`** — nova slice em `features/` (verbo: ação de escrita contra a API).
- **`new-page`** — nova tela (página + widgets + wiring de rota/guarda de papel/nav).
- **`add-shadcn-component`** — instalar um componente shadcn/ui no lugar certo do FSD.
- **`verify-visual`** — validar visualmente uma tela com Playwright, nos dois temas, com login
  de verdade contra a API local. Obrigatória depois de qualquer mudança de tela — ver a skill
  pra entender por quê (nenhuma sessão até agora teve ferramenta de browser interativa).

### Duas categorias de teste em `e2e/`

1. **Regressão permanente** (`cursor`, `login`, `auth`, `session-isolation`) — só usa contas
   seed fixas (`distribuidora@cartorio.com`, `conferente-rf27@cartorio.com`), sempre passa,
   sempre roda. É o que `npm run e2e` deveria rodar no dia a dia.
2. **Verificação visual pontual** (`minha-fila`, `distribuicao`, `importar`) — precisa de dado criado à mão
   pra popular cada coluna/estado (ver skill `verify-visual`); depois de rodada uma vez e os
   screenshots conferidos, o dado de teste é apagado — então rodar de novo sem re-semear **vai
   falhar**, e isso é esperado, não regressão quebrada. Cada arquivo documenta no topo o que
   precisa existir. Não vale a pena virar fixture automática ainda (custo > benefício num
   projeto sem CI); se/quando isso mudar, a fixture entra criando e limpando via API dentro do
   próprio teste, não com dado deixado por uma sessão anterior.

## Comandos

```
npm run dev      # sobe o Vite dev server (porta 5173)
npm run build    # tsc -b && vite build
npm run e2e      # roda os testes Playwright (ver skill verify-visual)
npm run e2e:ui   # idem, com a UI do Playwright pra debugar interativamente
```

## Estado atual

Scaffold completo: FSD (`app/pages/widgets/features/entities/shared`), autenticação ponta a
ponta (login, `/auth/me` no boot, guarda de rota por papel, logout), shadcn/ui com os aliases
certos, tema (cores, tipografia, logo, claro/escuro) copiado do protótipo aprovado.

**Minha fila (RF-19 a RF-24) é a primeira tela de verdade, construída de ponta a ponta**:

- `entities/protocolo` — tipos espelhando `ProtocoloResumo`/`ProtocoloConcluidoResumo` do back,
  `useMinhaFila`/`useConcluidosHoje` (GET).
- `features/minha-fila/{pegar-protocolo,iniciar-conferencia,concluir-conferencia}` +
  `features/protocolo/definir-observacao` — um verbo por slice, cada um invalidando a query
  certa depois de mutar (RF-20/21/22, RF-15/23).
- `widgets/minha-fila-board` — as 3 colunas + concluídos hoje, cronômetro ao vivo (RF-21,
  precisou de `IniciadoEm` novo no `ProtocoloResumo` do back — gap achado construindo isso,
  fechado na hora), chip de prazo pelas 4 faixas do semáforo.
- Novos primitivos em `shared/ui` (`Chip`, `SurfaceCard`) e `shared/lib` (`format.ts` pra
  duração/cronômetro, `use-now.ts` pro tick ao vivo) — ver seção "Tailwind: evitando className
  gigante" acima pro porquê.

**Distribuição (RF-13 a RF-18) também está construída de ponta a ponta**:

- `entities/conferente` — `GET /conferentes` (fecha o gap de nome de dono que faltava desde a
  visão por conferente/por status).
- `entities/protocolo` ganha `useVisaoDistribuicao` (`GET /protocolos/distribuicao`).
- `features/protocolo/{redistribuir-pool,atribuir-manualmente,descartar-excecao}` — RF-16/RF-17.
- `widgets/distribuicao-board` — 3 abas (por conferente, por status, exceções), reaproveitando
  `SurfaceCard`/`Chip`/`ObservacaoField` de Minha fila. `ObservacaoField` migrou de
  `widgets/minha-fila-board` pra dentro da própria feature `definir-observacao` (as duas telas
  usam, não fazia sentido morar dentro de um widget só).
- **Corrigido no caminho**: os cards de Minha fila (`ProtocoloCard`) não estavam pintando o
  card inteiro pela faixa do semáforo (só o chip) — o protótipo tinge o card inteiro
  (`background`/`border` do próprio card, não só do chip) em atenção/crítico/vencido.
  `SurfaceCard` ganhou a variante `tom` (mesmo valor do `Chip`) pra isso, usada nos dois widgets.
- **Simplificações conscientes, documentadas nos componentes**: sem nome de escrevente/equipe
  no card (só `escreventeId`, sem join hoje) e sem badge "Alta" prioridade (`Protocolo.Prioridade`
  não está em `ProtocoloResumo`) — nenhum dos dois é essencial pro RF-14, ficam pra quando/se o
  dono pedir.
- "Importar relatório" (RF-05 a RF-12) é tela própria que ainda não existe — o botão do
  protótipo pra ela ficou de fora do header por enquanto (não faz sentido linkar rota que não
  existe).

**Importar relatório (RF-05 a RF-12) construída de ponta a ponta, os 3 passos do protótipo aprovado**
(dados → revisão → distribuição — o protótipo mudou de 2 pra 3 passos depois de ajuste do time de
design; o back ganhou RF-08 pra sustentar o passo do meio, ver `../dispatch-api/CLAUDE.md`):

- `features/protocolo/importar-lote` — `usePreVisualizarLote`/`useConfirmarLote`, tipos espelhando
  `ImportarLoteRequest`/`ResumoImportacao` (agora com `linhas: LinhaPreviaImportacao[] | null`,
  RF-08 — nulo na confirmação).
- `entities/protocolo` ganha `TipoPrazo` (tipo) e `lib/rotulos.ts` (`ETAPA_LABEL`/`TIPO_PRAZO_LABEL`)
  — o back manda `Etapa`/`TipoPrazo` crus (mesmo padrão de `FaixaSemaforo`), o front formata o
  texto. "5º andar · pós-conferência" do protótipo é montado no front (`${equipe} · ${etapaLabel}`),
  não uma string pronta vinda do back.
- `widgets/importar-lote-wizard` — `PassoDados` (etapa + linha de corte + textarea) →
  `PassoLinhas` (RF-08: tabela linha a linha com prazo, regra e "leitura" — `N com alçada`/
  `tipo novo`/`já existe`, reaproveita `prazoChip` de `entities/protocolo` pro tom do chip) →
  `PassoPrevia` (prévia agregada + avisos + confirmar, RF-10/RF-11).
- **Controles nativos trocados por shadcn** (`select`/`popover`/`calendar` + `shared/ui/datetime-picker.tsx`
  próprio, que combina `Calendar` com um `<input type="time">` simples) — o `<select>` e o
  `<input type="datetime-local">` nativos do primeiro corte não tinham como estilizar (chrome do
  SO), destoavam do resto da tela. Trocado a pedido do dono depois de ver o resultado ao vivo.
  `date-fns`/`react-day-picker` entraram como dependência automática do `calendar.tsx` do shadcn.
- **Gotcha do `shadcn add`, nº 3**: `components.json` tinha um campo `"pointer": true` (herdado,
  por engano, de um flag de _init_ da CLI que eu tratei como campo persistível ao corrigir o bug
  de cursor) — isso quebra qualquer `npx shadcn add <x>` com "Invalid configuration found in
  components.json". Removido; o cursor-pointer já era coberto pela regra `@layer base` global,
  então não perdeu nada.
- **Simplificação consciente**: sem `.csv`/`.xlsx` de verdade — só colar linhas (RF-05 já permite
  isso explicitamente). Evita depender de uma lib de parsing de planilha por enquanto.

**Descoberta importante sobre o protótipo: o `.dc.html` pode estar desatualizado em relação à
ferramenta de design ao vivo.** O dono flagrou isso comparando um print da ferramenta contra o
que eu tinha lido do arquivo — o arquivo em disco realmente não tinha o conteúdo que a ferramenta
mostrava (mudanças ainda não exportadas). Depois que ele reexportou, sim bateu. **Lição: não
confiar cegamente numa leitura anterior do `.dc.html` nesta sessão — reler antes de qualquer
trabalho de fidelidade, e desconfiar se o dono disser que "está diferente".**

Descoberta técnica boa que resolve isso de vez: **o `.dc.html` roda sozinho num navegador de
verdade** (é um `<x-dc>` com `support.js`, interativo, com login/nav/estado). Dá pra abrir com
Playwright via `file://<caminho absoluto>` e navegar nele igual um app de verdade (clicar no
atalho "Distribuidora" pra entrar, clicar nas abas, abrir dropdown) — muito mais confiável que
interpretar o markup/CSS-in-JS na mão. **Esse é o método padrão daqui pra frente pra qualquer
verificação de fidelidade**: abrir os dois (protótipo real via `file://` e o app local) lado a
lado, printar os mesmos estados, comparar. Interpretar só o markup é o último recurso, não o
primeiro passo.

**Ajustes de fidelidade feitos numa segunda rodada, depois de navegar o protótipo de verdade**
(pedido do dono — Select/DateTimePicker "continuavam diferentes", e depois "confira Distribuição
também"):

- **Seletor de Etapa**: o `Select` do shadcn não tem como mostrar duas linhas dentro do próprio
  campo (rótulo + explicação, ex. "Pós-conferência" / "depois da lavratura"). Trocado por um
  `Popover` customizado (`SeletorEtapa`, dentro de `PassoDados.tsx`) com trigger de duas linhas e
  menu com rádio customizado — só pra esse campo, não virou componente genérico (só tem esse uso).
- **`DateTimePicker`**: trigger reescrito pra bater com o protótipo (ícone de calendário + "data
  · hora", sem o texto "às"); hora/minuto trocados de `<input type="time">` nativo pra steppers
  −/+ (`Stepper`, dentro do próprio arquivo); `Calendar` ganhou `locale={ptBR}` (`date-fns/locale`)
  pros dias da semana saírem em português.
- **Indicador de passo do wizard**: era pill/chip (`1 · dados`); virou círculo numerado + linha
  conectando, igual ao protótipo (`IndicadorDePassos`, `ImportarLoteWizard.tsx`).
- **`PassoDados`**: rodapé do textarea agora segue o protótipo — contador "N linhas coladas" e
  botão "Ler N linhas" com a contagem embutida, em vez de um "Pré-visualizar" genérico e sempre
  visível.
- **Distribuição**: legenda de prazo antes só aparecia nas abas "Por conferente"/"Por status" —
  agora aparece nas 3 (protótipo mostra em todas, inclusive Exceções); texto/cor dos 4 níveis
  corrigidos pra bater com as faixas reais (4h/60min) e a cor "bar" (mais saturada) que o
  protótipo usa nos swatches. `ProtocoloColuna`/`DistribuicaoProtocoloCard` ganharam um prop
  `variant` (`'conferente' | 'status'`) porque o protótipo estiliza a mesma informação diferente
  em cada aba: coluna com largura fixa (206px) + cabeçalho em card com badge de total (aba
  conferente) vs. coluna elástica + cabeçalho plano (aba status); valor de prazo em chip/pill
  (conferente) vs. texto simples colorido sem fundo (status). As duas abas também truncam em "+N
  protocolos" depois de 3 (conferente) ou 4 (status) cards — não existia truncamento antes.
  Cabeçalho da página ganhou os 4 segmentos do resumo (ativos/pool/em conferência/prazo
  estourado, "nenhum" por extenso quando zero — confirmado no código-fonte do protótipo, não é
  erro) e o botão "Importar relatório" (a rota já existe desde que Importar foi construída).
  `ObservacaoField` ganhou `somenteLeitura` — Distribuição só lê a observação (sem botão de
  editar); só Minha fila edita, que é onde o protótipo de fato tem esse botão.
  `ExcecaoCard` perdeu o `<select>` nativo (virou o `Select` do shadcn) e a tag fixa "exceção"
  virou dinâmica (`tagDaExcecao`, deriva de `motivoExcecao`: "tipo desconhecido" → "tipo novo",
  resto → "sem alçada" — o back não distingue "escala vazia" de "barrado por regra" como o
  protótipo simula, então não dá pra replicar os dois rótulos sem inventar dado).
- **`DateTimePicker`, terceira rodada** (o dono seguiu comparando depois do commit anterior —
  "continua diferente" foi certo duas vezes seguidas, valeu a pena insistir):
  - Fonte dos números do calendário e da letra do dia da semana estava na fonte de texto normal;
    protótipo usa JetBrains Mono nos dois (é dado tabular, mesmo padrão de número de protocolo/
    prazo em qualquer outra tela) — só o rótulo do mês ("agosto 2026") fica na fonte de texto.
    Como o `Calendar` do shadcn expõe um prop `classNames` que **substitui** a classe inteira da
    chave (não faz merge — passar `weekday: 'font-mono'` perderia o `flex`/tamanho que o
    react-day-picker já aplica), a correção foi via `className` do `Calendar` com seletor de
    descendente nas classes que o `getDefaultClassNames()` do react-day-picker já expõe
    (`rdp-weekday`, `rdp-day_button` — confirmado lendo o pacote, são classes reais, não hash de
    CSS module): `[&_.rdp-weekday]:font-mono [&_.rdp-day_button]:font-mono`.
  - Faltavam os 3 botões de atalho do protótipo embaixo dos steppers de hora: "Início do dia"
    (zera a hora, mantém a data), "Agora" (pula pra data/hora atual) e "Pronto" (fecha o
    popover). Adicionados. **Confirmado ao vivo, não só por print**: clicar num dia do calendário
    não fecha o popover sozinho nem aqui nem no protótipo (conferido no código-fonte — o
    `onClick` do dia só atualiza a data, quem fecha é sempre o "Pronto") — se parecer estranho
    de novo, não é regressão, é assim que o protótipo também se comporta.
  - Dias da semana também foram trocados de abreviação de 3 letras (`dom seg ter...`, que é o que
    o locale `ptBR` do `date-fns` dá por padrão) pra uma letra maiúscula (`D S T Q Q S S`), via
    `formatters.formatWeekdayName` — o `date-fns/locale` sozinho não cobre isso.
- **`DateTimePicker`, quarta rodada** (o dono mandou print de um "pequeno bug" e pediu pra tirar
  o espaço morto nas laterais do calendário — ele estava certo nas duas coisas):
  - O `PopoverContent` tinha virado `w-[266px]` fixo (rodada anterior) mas o `Calendar` continuou
    com `--cell-size` padrão (28px/célula) — a grade de dias (212px) sobrava 27px de vão morto de
    cada lado dentro do popover de 266px. Aumentado pra `[--cell-size:35px]` (a grade passa a
    ocupar 261px, ~2.5px de folga por lado — bem mais perto de "100% da largura" sem forçar
    overflow). O `flex justify-center` ao redor do `Calendar` (rodada anterior) continua
    necessário pra distribuir essa folga igual dos dois lados.
  - O "pequeno bug" do print: "hoje" aparecia com um anel de foco de teclado ao mesmo tempo que o
    dia selecionado (outro dia) tinha preenchimento sólido — duas marcações ao mesmo tempo, em
    dias vizinhos, parecendo ambíguo. Causa: `autoFocus` no `Calendar` pousa o foco de teclado em
    "hoje" assim que o popover abre; o protótipo não tem esse conceito (não há navegação por
    teclado nele). Removido o `autoFocus` — sem ele, "hoje" só mostra o indicador padrão e discreto
    de "dia atual" do react-day-picker, sem ring de foco competindo com o dia selecionado.
  - Confirmado por medição (`getBoundingClientRect`), não só por print: 266px de popover, 261px
    de calendário, 2.5px de folga simétrica nas duas laterais.
- **`DateTimePicker`, quinta rodada — bug real de dado, não só de fidelidade** (dono reportou:
  "não é possível editar data e hora digitando" e "linha de corte não filtra", usando um lote
  real de 12 linhas e corte "10:57"). As duas queixas eram a mesma causa:
  - O seletor (igual o protótipo, que também não tem digitação — só clique) só dava pra ajustar
    data via calendário e hora/minuto via stepper −/+ um em um. Pra chegar em "10:57" a partir de
    qualquer outro valor, seriam dezenas de cliques — na prática o usuário mexe só no
    hora/minuto e esquece de clicar no dia certo no calendário, deixando a _data_ errada sem
    perceber (o campo mostra "30/08/2016 · 12:57" ou parecido, fácil de não notar o ano errado
    num texto pequeno).
  - Isso expôs um segundo problema, esse sim uma regressão real em relação ao protótipo: o
    default daqui era `Date.now() - 10 anos` (comentário antigo: "pra não descartar nada na
    primeira importação"), enquanto o protótipo aprovado (`impCorte`, `Dispatch.dc.html`) usa
    **hoje às 00:00**. Com o default errado E sem digitação, qualquer lote do dia (sempre depois
    de qualquer horário de 10 anos atrás) passava no filtro `DataHoraAndamento > linhaDeCorte`
    inteiro — a linha de corte nunca filtrava nada de verdade, só parecia filtrar quando o
    usuário por acaso acertava ano/mês/dia certos via calendário.
  - **Correção, além da fidelidade**: campo de data (`dd/mm/aaaa`) e os dois campos de hora/minuto
    viraram `<input>` digitável de verdade (mantendo clique no calendário e os botões −/+ como
    alternativa, não removendo nada) — diverge do protótipo de propósito aqui, porque a
    precisão que RF-07 pede ("processar só o que aconteceu depois disso") não é alcançável só
    de clique quando o corte precisa ser um minuto exato do dia. Default voltou a bater com o
    protótipo (hoje 00:00).
  - Confirmado via Playwright digitando "10" e "57" direto nos campos (sem tocar em nenhum
    stepper) contra o CSV de 12 linhas do dono e corte 10:57: prévia leu `8 ignoradas / 4
processadas` — bate exatamente com as 4 linhas cujo horário é ≥ 10:57.
- **Bug real achado no caminho, não só fidelidade**: `prazoChip` (`entities/protocolo/lib/prazo-chip.ts`,
  usado por Minha fila **e** Distribuição) prefixava "vence em"/"estourou há" em qualquer faixa —
  o protótipo só usa esse prefixo nos 3 estados de risco (amarelo/laranja/vermelho); o estado
  verde ("no prazo") mostra só a duração pura. Corrigido no helper compartilhado, então já vale
  pras duas telas.
- **Gaps que ficaram documentados nos componentes, não corrigidos** (faltaria campo novo no
  back): sem "N feitos hoje" no subtítulo do card de conferente (precisaria de `ConcluidoEm` em
  `ProtocoloResumo`, que não existe — mostrar um número "de todo o histórico" com o rótulo "hoje"
  seria pior que não mostrar); canto do card "Concluídos" mostra aprovado/não aprovado em vez do
  tempo de conferência (mesma causa); sem linha de "tipo de ato" em nenhuma das duas abas
  (`ProtocoloResumo` só tem `tipoAtoId`, sem nome — precisaria de um `entities/tipoAto` que ainda
  não existe).
- **Verificação de comportamento, não só de aparência** (o dono cobrou isso explicitamente —
  print bonito não garante que a interação bate): testado ao vivo nos dois lados (protótipo via
  `file://`, app local com dado seedado por API) — adicionar observação em Minha fila, confirmar
  que Distribuição não deixa editar (só lê), e o fluxo de "Resolver" numa exceção. As duas
  primeiras bateram exatamente. A terceira revelou uma divergência de comportamento real (não só
  de rótulo): o protótipo nunca deixa a distribuidora escolher manualmente o conferente na tela
  de Distribuição — "tipo novo" navega pra Central de Regras (não existe aqui ainda), "sem
  alçada"/"barrado por regra" atribui sozinho ao primeiro conferente apto, sem perguntar nada.
  **Decisão consciente, confirmada com o dono**: manter o seletor manual (escolher conferente +
  confirmar) pros dois casos — mais seguro e auditável (RNF-02) que atribuir uma exceção sem
  revisão humana; o auto-atribuir do protótipo é lido como atalho de ferramenta de design, não
  regra de negócio real. Diverge do protótipo de propósito, não por gap.

**Bug crítico achado em uso real e corrigido**: deslogar de um papel e logar com outro
mostrava a sessão anterior primeiro — o cache do TanStack Query não era limpo no logout
(`queryKey` de `useCurrentUser`/`useMinhaFila`/etc. não tem escopo por usuário). Corrigido com
`queryClient.clear()` no logout, no login (defesa extra) e no handler de 401. Teste de
regressão permanente em `e2e/session-isolation.spec.ts` — ver seção de skills, abaixo.

Verificado: `tsc --noEmit` limpo, `npm run build` limpo, e **`verify-visual` completo nas duas
telas**: dados reais criados via API (conferentes, protocolos em cada estado/bucket/exceção),
login de verdade, screenshots nos dois temas lidos e conferidos — fidelidade boa nas duas
(cards, chips, cronômetro, abas, exceção com "Resolver"/"Descartar"). "Pegar este" e o fluxo de
troca de sessão testados clicando de verdade, não só olhando. Dados de teste limpos depois.

Verificado também: Importar relatório, os 3 passos ponta a ponta contra a API local com CSV real
(6 linhas, tipo conhecido e desconhecido misturados), `e2e/importar.spec.ts` (regressão) mais um
teste avulso de tema escuro — fidelidade boa nos dois temas. Dado de teste (protocolos,
escreventes, lote) limpo depois.

Com isso o fluxo principal de entrada de dado está fechado (Importar → Distribuição → Minha
fila).

**Conferentes (RF-25 a RF-30) construída de ponta a ponta.** O back não tinha tudo pronto —
planejar a tela achou um bug adormecido (`CargaAtual` nunca era atualizado, o desempate por
carga do motor de distribuição sempre comparava 0 contra 0) e dois gaps reais (RF-28 capacidade
estimada, RF-30 aviso de cobertura) — ver `../dispatch-api/CLAUDE.md`.

- `entities/conferente` ganha `capacidadeEstimada` no tipo `Conferente`, mais `AlcanceDoConferente`
  (`useAlcance`, `GET /conferentes/alcance`) e `CoberturaAlcada` (`useCobertura`,
  `GET /conferentes/cobertura`).
- `features/conferente/{cadastrar,editar-nivel-jornada,editar-perfil,marcar-presenca,remover}` —
  um verbo por slice. `marcar-presenca`/`remover` invalidam `VISAO_DISTRIBUICAO_QUERY_KEY` além
  de `CONFERENTES_QUERY_KEY` (RF-27: ausência/remoção devolve protocolos ao pool, a Distribuição
  muda junto).
- `widgets/conferentes-board` — `ConferentesBoard` (4 KPIs + lista + banner de cobertura),
  `ConferenteCard` (nível via pill que cicla Júnior→Pleno→Sênior, jornada via stepper ±1h
  clampado 2–12h — os dois editam direto no card, igual o protótipo), `NovoConferenteDialog` e
  `EditarConferenteDialog` (nome/e-mail — ver decisão abaixo).
- **Decisão sobre edição, revista duas vezes com o dono**: o protótipo edita tudo inline
  (inclusive o nome, direto num `<input>` no card) porque lá é uma ferramenta de design sem
  back de verdade. Aqui nome/e-mail são campos do `Usuario` (agregado separado do `Conferente`,
  que só sabe nível/jornada/escala) e passaram por três formatos até fechar: sem edição (gap
  não percebido) → inputs inline no próprio card → **modal próprio (`EditarConferenteDialog`),
  mesmo padrão visual do "Novo conferente"**, aberto por um ícone de lápis ao lado do nome.
  Nível/jornada continuam nos controles rápidos do card (não tem por que abrir modal pra um
  clique de stepper).
- **Cadastro é modal, não o "rascunho" do protótipo**: lá, "Novo conferente" só insere uma linha
  local com nome fixo "Novo conferente" pra editar depois; aqui o back exige e-mail/senha reais
  pra criar o `Usuario` de login junto (`CadastrarConferente`), então precisa de formulário
  completo antes de existir.
- **Achados testando a tela de verdade, não só em isolamento** (documentados a fundo no
  CLAUDE.md do back): lista sem `ORDER BY` "pulava" de posição a cada ação; "Remover" não
  filtrava quem tinha sido removido (`GET /conferentes` corrigido na fonte, não no front).
- **Alçada por linha do protótipo (frase completa, tipo "Analista Júnior pode conferir Venda e
  Compra, Doação...") não replicada** — ficou só "pode conferir N tipos de ato". Listar os
  nomes exigiria um `entities/tipoAto` que ainda não existe (`AlcanceDoConferente` só devolve
  `TiposPermitidosIds`, sem nome). Fica pra quando/se Central de regras (que vai precisar dessa
  entidade de qualquer jeito) for construída.
- `e2e/conferentes.spec.ts` (regressão permanente) — cadastra um conferente de teste, edita
  nome via modal, remove no final; usa `data-testid` no card (`conferente-card-{id}`) em vez de
  tentar achar "o card certo" por texto — mais confiável quando há vários cards com estrutura
  parecida na tela.

**"Minha fila" da Distribuidora (RF-19, leitura) construída** — o protótipo aprovado tem
"Minha fila" no menu de quem é gestão também, achado só depois de um print do dono (a
varredura inicial olhou a tela isolada, não a lógica do menu — ver CLAUDE.md do dispatch-api
pra a explicação completa de como o filtro do `nav` do protótipo libera todos os itens pra
gestão). Rota separada (`ROUTES.filaConferentes`, `/fila-conferentes`) da `Minha fila` do
Conferente — mesmo rótulo no menu, conteúdo bem diferente:

- `pages/fila-conferentes` — seletor de conferente ("VER COMO", `SeletorConferente` interno ao
  arquivo, populado por `useConferentes()`) + `widgets/fila-do-conferente-board`. Primeira
  versão usava o `Select` genérico do shadcn — trocado depois que o dono atualizou o protótipo
  com um dropdown customizado de verdade (mesmo padrão do `SeletorEtapa` de Importar: `Popover`
  - trigger de duas linhas + lista com indicador de seleção), substituindo o antigo botão "Ver
    como outro conferente" que só ciclava um por vez. Cada item da lista mostra nível + carga
    atual (`cargaAtual`) à direita; conferente ausente vem com opacidade reduzida, mas ainda
    selecionável (a Distribuidora pode querer ver a fila de alguém de folga). **Detalhe batido
    contra o protótipo e que quase passou batido**: o item ativo/selecionado precisa de um fundo
    diferenciado (`bg-secondary`) cobrindo a linha inteira, não só o indicador de seleção — faltava
    isso tanto aqui quanto no `SeletorEtapa` (o mesmo gap nos dois, corrigido nos dois juntos).
    Seleciona o primeiro conferente na escala por padrão (`naEscala`), ou o primeiro da lista se
    ninguém estiver.
- `widgets/fila-do-conferente-board` — mesmo board de 3 colunas de `minha-fila-board`, sempre
  em modo leitura. **Reaproveita os componentes de card** (`ProtocoloCard`, `EmConferenciaCard`,
  `ConcluidosHojeList`) do outro widget em vez de duplicar — os dois agora saem no barrel de
  `minha-fila-board/index.ts` (FSD permite import entre widgets do mesmo nível via API pública,
  não path direto pro `ui/` interno). Os dois cards ganharam `somenteLeitura?: boolean`: quando
  `true`, esconde o(s) botão(ões) de ação e passa o mesmo prop pro `ObservacaoField`
  (`onAcao`/`onAprovar`/`onReprovar` viraram opcionais).
- `entities/protocolo` ganha `useFilaDoConferente(id)`/`useConcluidosHojeDoConferente(id)` —
  chave de query com o id embutido (`['conferentes', id, 'fila']`), cada conferente com seu
  próprio cache, não uma query só trocando de dono por baixo.
- Nada de mutation nessa tela — os endpoints de ação nem aceitam chamada de quem não é
  Conferente (RNF-04), então não tem sentido a UI oferecer o que o servidor vai rejeitar.
- `e2e/fila-conferentes.spec.ts` (regressão permanente) — confirma que a tela carrega, que
  nenhum botão de escrita aparece (nem "Pegar este" nem "+ Observação"), e que trocar de
  conferente no seletor dispara uma leitura nova do back (`GET /conferentes/{id}/fila`), não é
  filtro local.

**Central de regras (RF-31 a RF-41) construída de ponta a ponta, as 3 abas juntas** (Aprendizado,
Alçada, Prazos por equipe — mesma tela no protótipo, `abasRegras`). O back já estava pronto pras
três desde antes desta sessão (commit "Adiciona a Central de Regras"); só faltava `GET
/tipos-ato` (catálogo não tinha endpoint de leitura, só usado internamente por
`ImportarLote`/`DistribuirProtocolo`), adicionado junto.

- `entities/tipoAto`, `entities/regraAlcada`, `entities/equipe`, `entities/escrevente`,
  `entities/sugestao` — cinco entidades novas. `NIVEL_LABEL` (antes duplicado em
  `ConferenteCard`/`NovoConferenteDialog`) subiu pra `entities/conferente/lib/rotulos.ts` na
  terceira repetição.
- **`fraseDaRegra`** (`entities/regraAlcada/lib/frase.ts`) monta a frase legível ("Nível Júnior
  não pode conferir Inventário") a partir do fato cru que o back manda — reaproveitada pela
  lista de regras e pelo preview ao vivo do construtor guiado (RF-32).
- **RF-32 (construtor guiado)**: é UI pura, sem endpoint próprio — monta o request de `POST
/regras-alcada` no fim. **Divergência deliberada do protótipo**: lá o builder deixa selecionar
  vários alvos e cria "uma regra com array de alvos", mas o back só aceita um alvo por regra
  (RF-31: `AlvoAlcada` é XOR etapa/tipo). Resolvido criando **uma regra por alvo selecionado**
  (`Promise.all` de `mutateAsync`) — preserva a UX de multi-seleção do protótipo sem inventar um
  conceito de "regra composta" que não existe no domínio.
- **`widgets/central-de-regras-board`** — mesmo padrão de `distribuicao-board` (um widget,
  estado de aba local, um componente por aba: `AbaAprendizado`/`AbaAlcada`/`AbaPrazos`).
  `PillToggle` (botão de seleção preenchido/borda, cores exatas tiradas do JS do protótipo —
  `bg:var(--ink)` selecionado vs `var(--surface)` não-selecionado) é usado pelos três: builder de
  regra, prazo pré/pós de equipe e chips de escrevente selecionável.
- **`EquipeCard`**: nome edita inline mas só salva no `blur` (não a cada tecla) — o back
  recalcula vencimento dos protocolos abertos a cada `PUT /equipes/{id}` (RF-38), então um PUT
  por tecla seria trabalho descartado. Prazo pré/pós já aplica direto no clique do pill (mesmo
  comportamento do protótipo).
- **Simplificações conscientes em relação ao protótipo, documentadas no código**: sem "índice de
  confiança"/barra de confiança e sem chips de "casos concretos" nos cards de sugestão — o
  protótipo mostra número mockado (não vem de lugar nenhum real); `Sugestao`
  (`Dispatch.Domain.Aprendizado`) só carrega `Evidencia` (texto) e `Ocorrencias` (contagem), não
  um score. Os 4 KPIs do topo da aba Aprendizado também trocaram "5.724 linhas lidas"/"96%
  classificadas sem você" (mock) por métricas derivadas de dado real (tipos no catálogo, regras
  em vigor, propostas na fila, aplicadas até hoje). Mesma linha do que já foi feito em
  Conferentes/Distribuição: não inventar dado que o back não calcula.
- Sem endpoint de excluir equipe — protótipo também não tem esse botão.
- `e2e/central-de-regras.spec.ts` — verificação visual pontual das 3 abas + construtor aberto,
  claro e escuro (ver seção de skills). Comportamento real testado à parte (não é o teste
  permanente): criar regra multi-alvo (2 POSTs confirmados), ativar/desativar, remover, mover
  escrevente órfão pra equipe, aplicar e descartar sugestão — todos com o efeito refletido na
  tela (KPIs recalculando, histórico crescendo) e confirmados via resposta de rede, não só DOM.

**Cadastro manual de tipo de ato**, na aba Alçada — complementa o cadastro automático que a
importação passou a fazer (ver `../dispatch-api/CLAUDE.md`, "Cadastro automático de tipo de ato

- normalização"). `NovoTipoAtoDialog` (mesmo padrão de `NovaEquipeDialog`), `features/tipoAto/criar`
  (`POST /tipos-ato`, 409 se já existir mesmo nome normalizado — trata igual duplicidade de e-mail
  em `NovoConferenteDialog`). Nome sai normalizado pelo back de qualquer jeito, front não precisa
  tratar isso. Confirmado via Playwright: cadastro novo (201) e duplicata com caixa diferente (409,
  mensagem "já existe um tipo de ato com esse nome").

**Badge de pílula no menu lateral** (RF-13/RF-39, `widgets/app-shell/ui/AppShell.tsx`) — igual
ao protótipo: "Distribuição" mostra `N exc` (tom de aviso) se tiver exceção aberta, senão o
tamanho do pool (tom neutro), senão nada; "Central de regras" mostra a fila de aprendizado
pendente. `useVisaoDistribuicao`/`useSugestoesPendentes` ganharam um `{ enabled }` opcional pra
essas duas queries do menu não disparar pra quem é Conferente (só Distribuidora tem permissão
nesses dois endpoints). `NavBadge` é local ao AppShell, não reaproveita o `Chip` de `shared/ui`
— o protótipo usa `var(--text-3)` no badge do menu, um tom mais escuro que o
`text-muted-foreground` que o Chip usa em todo canto.

**Painel de detalhe do protocolo (RF-18a/b) — primeira frente do "v2" do protótipo/requisitos**
(o dono atualizou os dois com bastante coisa nova; as outras frentes — Regras em vigor, Tipos
de ato com merge, correção de resultado + reabertura, Dashboard — ficam pra depois, ver plano
salvo). Drawer lateral (432px, desliza da direita) aberto ao clicar em qualquer card de
protocolo, em qualquer aba de Distribuição (`Por conferente`/`Por status`/`Exceções`).

- **`shared/ui/sheet.tsx`** (shadcn `Sheet`, Radix Dialog por baixo) — **não construído na mão**:
  o dono cobrou isso explicitamente ("nada de fazer as coisas do 0, veja se tem no shadcn
  primeiro"), certo — o `Sheet` já resolve animação de entrada/saída, overlay com blur e fechar
  por Esc/clique fora de graça, nenhuma dessas três coisas precisou de código próprio.
  `showCloseButton={false}` porque o protótipo tem um botão "Fechar" de texto, não o X padrão do
  componente.
- **`widgets/painel-detalhe-protocolo`** — `PainelDetalheProtocolo`, recebe `protocoloId: string
| null` + `onFechar`. Reaproveita `ObservacaoField` (mesmo campo de Minha fila/Distribuição),
  `fraseDaRegra` (Central de Regras, pra "regra aplicada"), `prazoChip`/`Chip` (mesmo semáforo
  de todo canto). `entities/protocolo` ganha `DetalheProtocolo`/`useDetalheProtocolo(id)` —
  `enabled: !!id`, só busca quando o painel está de fato aberto.
- **Duas ações novas** (`features/protocolo/devolver-ao-pool`, `features/protocolo/atribuir-ao-menos-carregado`)
  — um verbo por slice, igual todo o resto do projeto; invalidam `VISAO_DISTRIBUICAO_QUERY_KEY`
  e a query de detalhe do próprio protocolo (assim o painel atualiza sozinho depois da ação).
- **`formatDataHora`** subiu pra `shared/lib/format.ts` na terceira repetição (já existia
  duplicado em `PassoLinhas`/`PassoPrevia` do wizard de importação) — mesma regra que já vale
  pra classe Tailwind repetida, agora aplicada a uma função utilitária.
- Card de protocolo (`DistribuicaoProtocoloCard`) e card de exceção (`ExcecaoCard`) ganharam
  `onClick`/`cursor-pointer` no card inteiro; os botões de ação existentes (Descartar/Resolver,
  Confirmar/Cancelar) pararam de abrir o painel com `stopPropagation` no wrapper deles.
- Testado de ponta a ponta, não só aparência: `devolver-ao-pool` e `atribuir-ao-menos-carregado`
  clicados de verdade contra a API local, resposta de rede conferida (204/409), e o card por
  trás do painel atualiza sozinho (volta pro pool na tela, sem precisar de refresh).

**Central de Regras ganhou duas abas novas do "v2" do protótipo: "Regras em vigor" (agora a
aba padrão) e "Tipos de ato" completo** — as duas frentes que tinham ficado de fora do plano do
painel de detalhe.

- **`AbaRegrasEmVigor.tsx`** — leitura agregada, sem endpoint novo: reaproveita
  `useRegrasAlcada`/`useEquipes`/`useEscreventes`/`useTiposAto` (o que as outras abas já
  carregam) e monta frases por família (Alçada, Prazo, Catálogo de atos, Operação), cada grupo
  com um botão "Editar X" que troca de aba. "Operação" mostra só o que está implementado de
  verdade hoje (modo Híbrido, limite de 1 ato simultâneo, faixas do semáforo) — o protótipo tem
  um 4º item ("correção de resultado, 15 min") que fica de fora por enquanto, RF-24a ainda não
  foi construído.
- **`AbaTiposDeAto.tsx`** (RF-34a-b,d-f) — `entities/tipoAto` ganhou `useTiposAtoComUso`
  (`GET /tipos-ato/com-uso`, leitura agregada com volume e cobertura de alçada por tipo) e
  quatro slices novos em `features/tipoAto/` (`renomear`, `alterar-status`, `definir-peso`,
  `remover`) — um verbo por slice, como sempre. `TipoAtoRow.tsx` é a linha: nome edita inline
  (commit no blur, mesmo padrão de `EquipeCard`), peso via stepper ± (mesmo padrão do stepper
  de jornada em `ConferenteCard`), pill ativo/inativo e remover — o 409 "em uso" do back
  aparece como texto inline (`text-bad-fg`) embaixo da linha, mesma convenção usada nos
  diálogos de criar/editar (`isAxiosError` + checar `response?.status`).
  **RF-34c (mesclar dois tipos) fica de fora desta rodada** — precisaria migrar referências de
  `Protocolo`/`RegraAlcada` de um Id pro outro, maior que as ações já construídas.
- A lista de tipos de ato usada pelo construtor de regra (`AbaAlcada.tsx`) continua como chips
  de leitura simples — não foi consolidada com a tabela editável da nova aba; são propósitos
  diferentes (escolher alvo de uma regra vs. administrar o catálogo).
- **Bug real achado testando de verdade, não só aparência**: o primeiro teste de
  comportamento (renomear → peso → desativar → reativar → remover, tudo no mesmo tipo recém-criado)
  renomeou/removeu a linha **errada** duas vezes seguidas — sintoma de reusar um
  `Locator` posicional (`page.locator('input').nth(i)`, "ache o input cujo valor é X") capturado
  antes de um refetch que reordena a lista (`ListarTiposAtoComUso` ordena por nome). A correção
  foi reachar a linha do zero, pelo nome, imediatamente antes de cada ação, e esperar
  `networkidle` entre uma mutação e a próxima busca — o mesmo tipo de armadilha de "estado
  desconectado depois de um refetch" que já apareceu no back (`RegraAlcada`/`Sugestao`, ver
  CLAUDE.md do `dispatch-api`), só que do lado do teste em vez do change tracker do EF.
- `e2e/central-de-regras.spec.ts` ganhou as duas abas nos screenshots (claro e escuro) mais um
  teste de comportamento dedicado pra Tipos de ato (criar, renomear, peso, desativar/reativar,
  remover — cada passo confirmado pela resposta de rede). Precisou de um escrevente sem equipe
  seedado (`Escrevente Orfao E2e`, criado via `/protocolos/importar/confirmar` com um protocolo
  avulso) pra aba Prazos por equipe não falhar mais por falta de dado — documentado no topo do
  arquivo de teste.

**Correção de resultado + pedido de reabertura (RF-24a-d) — terceira frente do "v2"**, junto
com o ajuste de digitação do peso de tipo de ato (RF-34f, `TipoAtoRow.tsx` — o stepper ganhou
um `<input>` digitável ao lado dos botões ±, mesmo padrão `w-[Npx]`+`size` do `DateTimePicker`).

- **`ConcluidosHojeList.tsx`** (`widgets/minha-fila-board`) ganhou `now: number` (já calculado
  no board via `useNow()`) e `somenteLeitura?: boolean` (mesmo padrão de `ProtocoloCard`/
  `EmConferenciaCard` — a Distribuidora vendo a fila de outro conferente, via
  `fila-do-conferente-board`, não vê nenhum botão de ação). Por item concluído: dentro da
  janela de 15 min mostra contagem regressiva + "Corrigir para aprovado/não aprovado"; com
  pedido pendente mostra "Reabertura solicitada — aguardando a distribuidora" + "Cancelar
  pedido"; fora da janela sem pedido, "Pedir reabertura à distribuidora". Três features novas
  em `features/minha-fila/` (`corrigir-resultado`, `pedir-reabertura`,
  `cancelar-pedido-reabertura`).
- **`entities/pedidoReabertura`** (novo) — `usePedidosReaberturaPendentes`
  (`GET /protocolos/pedidos-reabertura`).
- **`AbaExcecoes.tsx`** (`widgets/distribuicao-board`) ganhou a seção "Pedidos de reabertura ·
  N" acima da lista de exceções — `PedidoReaberturaCard.tsx` (novo), mesmo esqueleto de
  `ExcecaoCard` mas decisão binária (Reabrir/Negar, sem alternar pra formulário — reabrir
  mantém o mesmo dono, não precisa escolher ninguém). O rótulo da aba passou a ser
  `Exceções · N · M pedido(s)` (RF-18b: contadores separados), reaproveitando
  `usePedidosReaberturaPendentes` em `DistribuicaoBoard.tsx`. Feature nova
  `features/protocolo/decidir-pedido-reabertura`.
- **`PainelDetalheProtocolo.tsx`** ganhou `podeReabrirConferencia` (`status is 'Aprovado' |
'Reprovado'`) no mesmo bloco de ações condicionais que já tinha "devolver ao pool"/"atribuir
  ao menos carregado", mais duas linhas na timeline (`Corrigido`/`Reaberto`). Feature nova
  `features/protocolo/reabrir-conferencia`.
- **Achado num teste de comportamento real (não só aparência), `data-testid` virou necessário**:
  o primeiro locator por texto (`page.locator('div').filter({ hasText: numero })`) quebrava
  porque a estrutura de `ConcluidosHojeList`/`PedidoReaberturaCard` tem o número num nó
  descendente de mais de um `div` aninhado — `.first()`/`.last()` pegava o nível errado
  dependendo da ordem de match. Resolvido com `data-testid={`concluido-${protocolo.id}`}` e
  `data-testid={`pedido-reabertura-${pedido.pedidoId}`}` nos componentes — mesma convenção já
  usada em `conferente-card-{id}` (ver CLAUDE.md, seção Conferentes), agora estendida aqui.
- **`page.clock` do Playwright é escopado ao `BrowserContext` inteiro, não só à `Page`** —
  usado pra avançar o relógio do browser 16 min (sair da janela de correção e testar "pedir
  reabertura" de verdade, clicando). Abrir uma `page.context().newPage()` pro login da
  Distribuidora ainda herdava o relógio mockado/congelado e travava a navegação; precisou de
  `browser.newContext()` (contexto novo de verdade) pra ter relógio real de novo.
- `e2e/correcao-reabertura.spec.ts` (novo) — comportamento real ponta a ponta: cria o próprio
  cenário via API (tipo de ato, protocolo, conferente concluindo), corrige dentro da janela
  pela UI, avança o relógio, pede reabertura, decide como distribuidora (aba Exceções) —
  confirmado por resposta de rede em cada passo, não só pelo que aparece na tela. Limpa
  qualquer sobra de uma execução anterior no início (RF-21: limite de 1 ato simultâneo
  bloquearia "iniciar" se sobrasse algo "em conferência" de um teste interrompido no meio).

**Dashboard (RF-42-46) — quinta frente do "v2", tela nova pros dois papéis.**

- **`entities/dashboard`** (novo) — `useDashboard(periodo)`, tipos espelhando
  `DashboardResponse`. `shared/config/routes.ts` ganhou `dashboard: '/dashboard'`, rota
  registrada com `RequireRole(['Distribuidora','Conferente'])` (primeira rota do projeto
  acessível pelos dois papéis ao mesmo tempo sem ser duas rotas separadas — RNF continua
  garantida no back: o back decide o que devolver conforme o token, não o front).
  `NAV_POR_PAPEL` ganhou "Dashboard" nos dois arrays.
- **Dois componentes shadcn instalados** (`npx shadcn add progress` e `add table`) —
  primeira vez que o projeto usa uma tabela HTML de verdade (`<table>`) em vez de
  `div`+flex; fez sentido aqui porque a tela tem colunas fixas de verdade (nome, número,
  barra, badge), diferente das listas de card do resto do app.
- **`widgets/dashboard-board`** — `DashboardBoard` (tabs de período, mesmo padrão de
  `DistribuicaoBoard`/`CentralDeRegrasBoard`, não Popover — só 3 opções fixas) decide entre
  `VisaoGestao` (KPIs + tabela de desempenho/score/faixa + desempenho por tipo de ato) e
  `VisaoConferente` (KPIs próprios + card de score com as 4 parcelas + "Você × média da
  casa", **sem** o rótulo/badge de faixa de bônus — RF-45). `KpiCard.tsx` reaproveita o
  mesmo padrão visual já usado em `AbaAprendizado.tsx` (Central de Regras).
- **Bug real do componente `Progress` gerado pelo `shadcn add`, achado testando de
  verdade (não só aparência)**: o componente desestrutura `value` das props só pra calcular
  o `transform` do indicador manualmente, mas **nunca repassa `value` de volta pro
  `ProgressPrimitive.Root`** do Radix — o Root ficava sempre em `data-state="indeterminate"`
  (sem saber o valor real), e a barra renderizava com `width: 0`, invisível, mesmo com o
  indicador interno tendo o `transform` matematicamente certo. Só apareceu inspecionando o
  DOM via Playwright (`getBoundingClientRect`), não bastava olhar o screenshot — a barra
  simplesmente não estava lá, sem erro nenhum no console. Corrigido em
  `shared/ui/progress.tsx`, adicionando `value={value}` explícito na Root. Vale conferir
  esse mesmo padrão (`value`/prop controlada desestruturada e não repassada) se algum outro
  componente do shadcn parecer "sem efeito" no futuro — não é a primeira vez que o CLI gera
  algo que precisa de ajuste (ver as "armadilhas do shadcn" já catalogadas acima).
- `e2e/dashboard.spec.ts` (novo) — visão gestão (KPIs, tabela, troca de período dispara
  refetch de verdade) e visão conferente (confirma que "Bônus"/faixa e a tabela com nome de
  colega **não aparecem**, não só que os elementos certos aparecem), nos dois temas.
- Duas correções de teste de regressão permanente pré-existentes, achadas de passagem
  (não causadas por este trabalho): `distribuicao.spec.ts` e `minha-fila.spec.ts` usavam
  `getByText(...)` sem `exact`/`.first()` e quebravam com dado acumulado de sessões
  anteriores (mais de uma exceção "sem alçada", ou o texto "Em conferência" também
  aparecendo dentro do placeholder "nada em conferência — pegue um do pool").

Ainda não existem testes de unidade (vitest) nem lint rodado a sério (eslint/oxlint já vem do
scaffold do shadcn, mas ainda não foi ligado ao fluxo). Próximo passo natural: os ajustes
cirúrgicos documentados no plano (carga acumulada na rodada de importação, RNF-10, índice de
confiança da sugestão, cumprimento de prazo por equipe no Dashboard).

## Deploy — no ar

Site: **`lab-dispatch-web`** no Netlify (prefixo `lab-` pelo mesmo motivo do back — nome curto
sem sufixo tipo `-cartorio` — ver `../dispatch-api/CLAUDE.md`, seção "Deploy — no ar").

- **URL**: `https://lab-dispatch-web.netlify.app`.
- **Build**: `netlify.toml` na raiz — `npm run build` publicando `dist/`, mais um `[[redirects]]`
  `/* → /index.html` (status 200) obrigatório porque a app é SPA com `BrowserRouter`: sem isso,
  recarregar a página numa rota tipo `/distribuicao` dá 404 (o Netlify tenta achar um arquivo
  físico `distribuicao`, que não existe).
- **`VITE_API_URL`** é variável de build (`netlify env:set`, não vai pro repo) apontando pra
  `https://lab-dispatch-api.onrender.com` (backend migrou do Fly.io pro Render — ver
  `../dispatch-api/CLAUDE.md`, "Deploy — no ar", o Fly saiu do free tier sem cartão).
  **Gotcha real**: `vite build` local roda em modo `production` por padrão e **não** lê
  `.env.development` — um `npm run build` local sem essa env var configurada localmente
  geraria um bundle com `VITE_API_URL` `undefined`. Por isso o deploy é sempre `netlify deploy
--prod --build` (o build roda do lado do Netlify, com a env var certa), nunca upload de um
  `dist/` gerado na máquina local.
- **Se o site for renomeado de novo** (nome do Netlify muda a URL de produção, que é a origem
  CORS): precisa atualizar a env var `Cors__AllowedOrigin` no dashboard do Render também — os
  dois lados guardam o nome um do outro, não tem descoberta automática.
- Sem CI/CD ligado a git push ainda — deploy é manual via `netlify deploy --prod --build`,
  disparado quando o dono decide subir.

## Lazy loading por página

`app/routing/router.tsx` — cada `*Page` (exceto `LoginPage`, que faz parte do boot inicial de
qualquer sessão não autenticada) vira `React.lazy(() => import('@/pages/x').then(m => ({
default: m.XPage })))`, com um `<Suspense fallback={<CarregandoPagina />}>` envolvendo o
`<Routes>` inteiro. Precisa do `.then(...)` porque as páginas exportam nomeado (`export {
XPage }`), não `export default` — `React.lazy` só aceita módulo com `default`.

Efeito real, não só teórico: o build antes gerava um bundle único de ~655 kB (acima do limiar
de aviso do Vite); depois virou vários chunks por rota (o maior isolado ficou com ~241 kB, o
"core" compartilhado — React/TanStack Query/router — o resto de cada tela varia de ~1 kB a
~96 kB, `importar` é a maior por causa do `calendar`/`date-fns` do `DateTimePicker`). Quem abre
o app pela primeira vez não baixa mais código de telas que talvez nunca visite.

## Auditoria de over-fetching — achados e correções

Levantamento pedido pelo dono: pra cada página, quais queries ela dispara e se fazem sentido.
A maioria do projeto já seguia o padrão certo (`enabled` condicional onde importa, mount
condicional por aba nas telas com abas). Dois achados reais, corrigidos:

- **`PainelDetalheProtocolo` fica montado o tempo todo em `DistribuicaoBoard.tsx`** (só o
  `Sheet` visualmente abre/fecha — desmontar o componente inteiro cortaria a animação de saída
  do Radix). `useDetalheProtocolo` já tinha `enabled: !!id` desde que o painel foi construído,
  mas as outras 5 queries do painel (`useConferentes`, `useTiposAto`, `useRegrasAlcada`,
  `useEscreventes`, `useEquipes`) não tinham guarda nenhuma — disparavam sempre que
  `/distribuicao` carregava, painel aberto ou não. Os cinco hooks (em `entities/*`) ganharam
  `options?: { enabled?: boolean }` (mesmo padrão já usado em `useVisaoDistribuicao`/
  `useSugestoesPendentes` pro `AppShell`), e `PainelDetalheProtocolo.tsx` passa `enabled:
!!protocoloId` nos cinco. `useDetalheProtocolo` fica de fora da lista de hooks alterados —
  já estava certo.
- **`AbaPrazos.tsx` buscava `GET /escreventes` e `GET /escreventes/sem-equipe` juntos**, sendo
  que o segundo é um subconjunto trivial do primeiro (`escreventes.filter(e => !e.equipeId)`)
  — o próprio `AbaRegrasEmVigor.tsx` já fazia esse filtro localmente em vez de um GET
  dedicado. Removido: `useEscreventesSemEquipe`/`ESCREVENTES_SEM_EQUIPE_QUERY_KEY`/
  `getEscreventesSemEquipe` (ninguém mais os usava depois da troca), `AbaPrazos.tsx` deriva
  `semEquipe` do `escreventes` que já busca, e as duas mutations que invalidavam essa query
  key à toa (`useMoverParaEquipe`, `useAplicarSugestao`) pararam de fazê-lo.

Não achado: nenhuma duplicata real de `queryKey` diferente pro mesmo dado (os casos de hook
repetido em componentes diferentes — `useVisaoDistribuicao` em `DistribuicaoPage`+
`DistribuicaoBoard`, `usePedidosReaberturaPendentes` em `DistribuicaoBoard`+`AbaExcecoes`,
`useSugestoesPendentes` em `AppShell`+`CentralDeRegrasBoard`+`AbaAprendizado` — todos usam a
mesma `queryKey`, então o TanStack Query já dedupa em uma requisição só).

## RNF-10 — nome de registro não trunca

_"Nenhum nome de registro pode ser truncado em tela cuja função é distinguir registros
parecidos (catálogo de tipos, lista de escreventes): o nome quebra em linha."_ Levantamento
completo achou 16 ocorrências, corrigidas em duas categorias:

- **Corte de dado** (`AbaPorConferente.tsx`, `AbaPorStatus.tsx`, `AbaRegrasEmVigor.tsx`):
  `.split(' ')[0]` cortava o nome pro primeiro nome só — colisão garantida entre homônimos.
  Trocado por mostrar o nome completo.
- **Truncamento CSS** (`ConferenteCard`, `FilaConferentesPage` — seletor "VER COMO",
  `AbaAlcada` — matriz "o que cada um alcança", `PassoLinhas`/`PassoPrevia` do wizard de
  importação, `DistribuicaoProtocoloCard`, `PainelDetalheProtocolo`, `AppShell`, `ExcecaoCard`):
  classe `truncate`/`line-clamp-1` trocada por `text-pretty`/quebra de linha normal.

**Padrão de correção usado em toda linha/card com nome ao lado de outros campos de 1 linha**
(contagem, badge, chip): trocar `items-center` do container por `items-start`, e compensar os
campos vizinhos (que continuam sempre 1 linha) com `mt-0.5`/`mt-1`/`mt-px` — sem isso, um nome
que quebra em 2 linhas faz o container inteiro crescer e os vizinhos ficam centralizados no meio
do bloco todo, em vez de alinhados com a primeira linha do nome. Não é troca mecânica de classe:
cada arquivo pede o offset certo pro próprio layout (`ver AbaAlcada.tsx`, `PassoLinhas.tsx` como
referência do padrão).

**`ExcecaoCard.tsx` é o único caso que precisou de override local em vez de só trocar
classe**: o seletor de conferente usa `SelectValue` do shadcn, que tem `line-clamp-1` +
`whitespace-nowrap` + `h-8` fixos direto no `shared/ui/select.tsx` (`SelectTrigger`). Mexer no
componente compartilhado afetaria outros selects do app que não são "nome de registro" (ex.
seletor de nível/status) — a correção ficou local, via `className` no `SelectTrigger`/
`SelectValue` específico desse card, usando `data-[size=default]:h-auto` (mesmo modificador da
classe original) pra o `tailwind-merge` reconhecer o conflito e descartar o `h-8` de verdade —
um `h-auto` sem o modificador não teria sido substituído (grupos de classe com modificador
diferente não colidem no `twMerge`, os dois ficariam na `className` final e a ordem de quem
vence no CSS gerado ficaria imprevisível).

## Motor de alçada v2 — equipe, alçada plena, grupo de tipo (só o construtor, não a tela nova)

Fecha o lado front da revisão grande do motor de alçada (ver `../dispatch-api/CLAUDE.md`,
"Motor de alçada v2"). Escopo combinado com o dono: só o necessário pra criar as regras novas
pela UI que já existe — a reformulação visual grande da aba Alçada do protótipo v2 (3 sub-abas
novas: Camadas/Matriz/Testar) fica de fora, é projeto à parte.

- **`entities/regraAlcada`** — `RegraAlcada`/`CriarRegraAlcadaRequest` ganham `alvoEhEquipe`,
  `alvoEquipeId` (`string | null` — nulo é "sem equipe" como alvo válido, RF-29a) e
  `alvoTodosOsAtos` (alçada plena, RF-29b). `fraseDaRegra` ganha `nomeEquipe` nos lookups e os
  textos "conferir atos da equipe X" / "conferir atos de escreventes sem equipe" / "conferir
  todos os atos" — os três call sites (`AbaAlcada`, `AbaRegrasEmVigor`,
  `PainelDetalheProtocolo`) já buscavam `useEquipes()` ou ganharam a busca pra montar o lookup.
- **`entities/tipoAto`** — `TipoAto`/`TipoAtoComUso` ganham `grupo: GrupoTipoAto | null` (5
  valores fixos: Transmissões/Sucessões/Família/Garantias/Notariais — mesmo enum do back, sem
  entidade própria). `GRUPO_LABEL` novo em `lib/rotulos.ts`.
- **`features/tipoAto/definir-grupo`** (novo, mesmo molde de `definir-peso`).
- **`widgets/central-de-regras-board/ui/AbaAlcada.tsx`** — o construtor guiado ganha mais duas
  opções de alvo (`'equipe' | 'todos'`, ao lado de `'tipo' | 'etapa'`): "equipe" reaproveita
  `useEquipes()` (já buscado por outras abas) + uma opção "sem equipe" (sentinela
  `SEM_EQUIPE`, traduzida pra `null` só na hora de montar o request — `alvoSelecionados` é
  `string[]`, não aceita `null` direto); "todos" não tem segunda etapa de seleção, cria a regra
  direto no clique de "Criar regra".
- **`widgets/central-de-regras-board/ui/TipoAtoRow.tsx`** — ganha um `Select` de grupo (5
  opções + "sem grupo"), mesmo padrão de commit imediato dos outros campos da linha (peso,
  ativo/inativo).

Verificado ponta a ponta contra uma cópia real dos dados de produção (mesma clonagem usada do
lado do back): criar regra de equipe = "sem equipe" e regra de alçada plena pelo construtor,
confirmando a frase gerada e o painel "O que cada um alcança hoje" refletindo a lista fechada
certa (Analista Júnior com 1/3 tipos, batendo com o bug relatado em produção); definir grupo
"Notariais" num tipo de ato e confirmar que persiste. Nos dois temas.

## Índice de confiança real da sugestão (RF-39)

Fecha a simplificação consciente documentada desde a construção da Central de Regras — ver
`../dispatch-api/CLAUDE.md`, seção "Índice de confiança real da sugestão", pra fórmula. `Sugestao`
(`entities/sugestao/model/types.ts`) ganhou `indiceConfianca: number` (0.0–1.0).
`AbaAprendizado.tsx` — cada card de sugestão pendente ganhou uma barra
(`shared/ui/progress.tsx`, já com o bug de `value` corrigido nesta sessão) + "N% de confiança",
mesma posição do protótipo aprovado (badge de classe à esquerda, barra+percentual à direita, na
mesma linha do topo do card). Chips de "casos concretos" continuam de fora — `Sugestao` só
carrega evidência agregada (texto) e contagem, nunca uma lista de exemplos específicos.

## Distribuição/Minha fila v2 — prioridade manual, RF-14, RF-16, RF-18c, RF-18e/RF-24f

Sexta frente do "v2", escolhida pelo dono entre as opções apresentadas depois do motor de
alçada v2. Cinco itens, back já pronto (ver `../dispatch-api/CLAUDE.md`, mesma seção):

- **Prioridade manual** (pré-requisito dos outros) — `entities/protocolo` ganha `prioridade`
  em `ProtocoloResumo`. `features/protocolo/definir-prioridade` (mesmo molde de
  `reabrir-conferencia`). `PainelDetalheProtocolo.tsx` ganha um botão que alterna "Marcar como
  urgente"/"Remover urgência" (texto conforme `detalhe.prioridade`), visível quando o status
  não é `Aprovado`/`Reprovado`/`Descartado` — mesmo critério de "estado ativo" que já rege
  `podeDevolverAoPool`/`podeAtribuirAoMenosCarregado`.
- **RF-14** (card de Distribuição mostra tipo de ato/escrevente/equipe) — sem DTO novo, mesmo
  padrão de "back manda o fato cru, front resolve o nome" já usado no painel de detalhe:
  `DistribuicaoBoard.tsx` busca `useEscreventes()`/`useEquipes()`/`useTiposAto()` e monta um
  resolver único `resolverInfoProtocolo` (devolve `InfoProtocolo`, os 4 campos juntos) em vez
  de 3 props separadas — evita prop-drilling pelos componentes que só repassam adiante
  (`ProtocoloColuna`/`ExcecaoCard`). `DistribuicaoProtocoloCard.tsx` ganha duas linhas (tipo de
  ato; escrevente + `Chip` de equipe, vermelho quando `null` — "sem equipe"). Escopo
  consciente: só o card de Distribuição — RF-14 é seção 6.3, específica dessa tela; Minha fila
  (RF-24, seção 6.4) não pede o mesmo no card, só no filtro (ver RF-24f abaixo).
- **RF-16** (loading no "Redistribuir pool") — `DistribuicaoPage.tsx`, texto do botão vira
  "Redistribuindo…" com `Loader2Icon` (`animate-spin`) enquanto `redistribuir.isPending`.
- **RF-18c** (lista completa da coluna, expansível) — `ProtocoloColuna.tsx`: o texto estático
  "+N protocolos" virou `<button>` que abre `ListaCompletaColunaSheet.tsx` (novo), listando
  **todos** os protocolos da coluna (não só os ocultos), ordenados por vencimento; clicar num
  item abre o painel de detalhe e fecha o sheet. Simplificação consciente, documentada no
  componente: sem "quantos têm alçada" por item — exigiria `IConferenteRepository`/
  `IRegraAlcadaRepository` novos em `ObterVisaoDistribuicao` só pra isso, e a mesma informação
  já está um clique adiante no painel de detalhe (lista completa de "quem pode conferir",
  estritamente mais rica que uma contagem).
- **RF-18e/RF-24f** (barra de filtros, Distribuição e Minha fila) — **100% client-side**
  ("os filtros não alteram dado nenhum, só o recorte exibido" — RF-18e é explícito nisso, sem
  endpoint novo). Novo widget compartilhado `widgets/filtro-protocolos` (mesmo precedente de
  reuso entre widgets já usado por `fila-do-conferente-board` importando de
  `minha-fila-board`): hook `useFiltroProtocolos` devolve um predicado `passaNoFiltro`, não uma
  lista já filtrada — `DistribuicaoBoard` tem 5+ sub-listas (pool/atribuidos/emConferencia/
  concluidos/excecoes/grupos de `porConferente`) que precisam do mesmo estado de filtro
  aplicado independentemente, então cada board faz `.filter(passaNoFiltro)` na própria lista.
  4 eixos combináveis (equipe, tipo de ato, prioridade, prazo pelas 4 faixas do semáforo) —
  interpretação assumida (texto do requisito ambíguo): "prioridade e prazo" são dois eixos
  separados, não um combinado; contagem por opção sempre contra o conjunto completo não
  filtrado (não o recorte já filtrado pelos outros eixos), mais simples e ainda cobre "a gestão
  sabe o tamanho do recorte antes de aplicar". `MinhaFilaBoard.tsx`/`FilaDoConferenteBoard.tsx`
  ganham a mesma barra, sobre `poolDisponivel`/`atribuidos`/`emConferencia`.

**Bug real de Rules of Hooks, achado por revisão de código antes de rodar** — não em produção,
mas registrado porque é o tipo de erro que passa despercebido em diff superficial:
`DistribuicaoBoard.tsx` chamava `useFiltroProtocolos` **depois** do `if (isLoading || !visao ||
...) return <p>Carregando…</p>` já existente — número de hooks diferente entre renders.
Corrigido movendo a chamada (com `todosOsProtocolos` calculado via `visao ? [...] : []`, e as
outras dependências com fallback `?? []`) pra **antes** do early return, sem mudar a posição do
early return em si.

**Bug real de autorização, achado só pelo Playwright, não pelo `tsc`/build** — documentado a
fundo do lado do back (`../dispatch-api/CLAUDE.md`, mesma seção): `useEquipes`/`useEscreventes`/
`useTiposAto` (as três queries que `resolverInfoProtocolo`/`useFiltroProtocolos` dependem)
voltavam 403 quando quem estava logado era um Conferente, porque os endpoints eram
Distribuidora-only — sobrou como se o filtro "funcionasse" (marcava "1 filtro ativo") mas não
reduzisse nada de verdade (todo protocolo caía em "sem equipe" pelo `?? null` do lookup vazio).
Corrigido no back; o teste que pegou isso (`e2e/distribuicao-v2.spec.ts`) ficou com uma
asserção explícita de contagem antes/depois do filtro — não só "o filtro está marcado como
ativo", que teria deixado passar o bug de novo se reaparecesse. **Lição**: pra qualquer barra
de filtro/leitura cruzada nova, testar logado como o papel de menor privilégio que a usa, não
só como Distribuidora — um 403 silencioso em uma das queries auxiliares não quebra o layout,
só o resultado.

Verificado nos dois temas via `verify-visual` (`e2e/distribuicao-v2.spec.ts`, novo): badge
"urgente" e marcar/desmarcar pelo painel refletindo no card, RF-14 com os dois casos (equipe
normal e "sem equipe" vermelho), "Redistribuindo…" capturado com `page.route` atrasando a
resposta, lista expandida da coluna abrindo e navegando pro detalhe, filtro de Prioridade e
Prazo isolados e combinados em Distribuição, filtro de Equipe em Minha fila com assert de
contagem reduzindo de verdade. Regressão permanente (`auth`/`session-isolation`/`cursor`/
`login`) e os 239 testes do back confirmados verdes depois da correção de autorização.

## Motor de alçada v3 — redesign da aba Alçada (Camadas/Matriz/Testar)

Fecha o lado front do Motor v3 (ver `../dispatch-api/CLAUDE.md`, mesma seção, pro algoritmo e
pra divergência achada entre o protótipo interativo e o documento de requisitos formal). A aba
Alçada de Central de Regras virou 3 sub-abas, reaproveitando o construtor guiado (RF-32) já
existente, agora estendido com alvo de grupo e permissão de reserva.

- **`AbaAlcada.tsx`** — virou só o contêiner: cabeçalho + pills das 3 sub-abas (`Camadas`/
  `Matriz`/`Testar`, mesmo padrão de pill-tabs de `DistribuicaoBoard`) + o construtor guiado
  (compartilhado pelas 3, um único botão "Nova regra" no cabeçalho). `Builder.alvoTipo` ganhou
  `'grupo'`, `Builder.permissao` ganhou `'Reserva'` (agora é o mesmo `PermissaoRegra` do back).
  `abrirBuilderParaCamada(camada)` pré-seleciona sujeito/alvo a partir dos botões "Nova regra de
  X" de cada camada, na aba Camadas — mesmo espírito do protótipo, cada camada com seu atalho.
- **`AbaAlcadaCamadas.tsx`** (novo) — as regras existentes, agora agrupadas em 3 seções fixas
  (Base por nível / Ajuste por equipe / Exceção por pessoa) em vez de lista única achatada.
  `camadaDe(regra)` replica a mesma classificação do back (`ResolvedorAlcada.CamadaDe`) só pra
  agrupar a leitura — não decide alçada nenhuma, é dado que já veio resolvido do back. Reaproveita
  o card de regra (frase/origem/ativar/remover) sem mudança. "O que cada um alcança hoje" (RF-34)
  migrou pra cá sem alteração.
- **`AbaAlcadaMatriz.tsx`** (novo) — grade grupo/tipo × pessoa, sem endpoint novo: cruza `GET
/conferentes/alcance` (já devolve `tiposPermitidosIds`) com `GET /tipos-ato` (nome + grupo) no
  próprio front. Linha de grupo expande/colapsa pra mostrar os tipos individuais. **Divergência
  deliberada do protótipo**: lá, um clique num grupo "cheio" cria uma regra de **negação**
  escondida (bloqueia o grupo inteiro mesmo vindo de outra fonte, tipo nível); aqui, cada clique
  só cria ou remove a regra atômica que a própria matriz criou (`sujeitoConferenteId` + `Permite`
  - `alvoGrupo`/`alvoTipoAtoId`) — se o alcance vier de outro lugar (nível, alçada plena), a
    matriz não inventa um bloqueio silencioso; quem quer negar usa o construtor guiado, onde
    "Nega" é uma escolha explícita, não um efeito colateral de clicar numa célula verde. Motivo:
    o back só aceita um alvo por regra (sem array como o protótipo), então "desligar uma pessoa
    de um grupo cheio" não tem uma única regra óbvia pra remover quando o alcance dela vem de uma
    regra de nível compartilhada com outras pessoas — inventar uma negação ali seria arriscado sem
    confirmação explícita do usuário.
- **`AbaAlcadaTestar.tsx`** (novo) — consome o `POST /regras-alcada/testar` novo do back
  (`useTestarAlcada`, `entities/regraAlcada`). Réplica do layout do protótipo: seletores de
  etapa/equipe/tipo, veredito colorido (verde/vermelho), duas colunas "Podem conferir"/"Barrados
  e por quê", cada uma com a trilha por camada (`fraseDaRegra` reaproveitado pra cada passo).
  **Sem a seção "SAÍDAS"** do protótipo (sugestões automáticas de ajuste tipo "desativar essa
  regra") — o back não calcula isso, e inventar no front contrariaria a regra de não inventar
  dado que o servidor não manda.
- **`entities/regraAlcada`** — `PermissaoRegra` ganha `'Reserva'`; `RegraAlcada`/
  `CriarRegraAlcadaRequest` ganham `alvoGrupo`; `fraseDaRegra` ganha um molde de frase próprio
  pra Reserva ("Só X confere Y", sem o pode/não pode) e o branch de grupo ("conferir atos de
  Transmissões"), mesma fonte usada pelo card de regra e pela trilha do simulador. Novos tipos
  `MotivoAlcada`/`PassoTrilha`/`AvaliacaoAlcada`/`TestarAlcadaRequest`/`TestarAlcadaResponse` +
  `MOTIVO_ALCADA_LABEL` (rótulo por dimensão — o nome próprio que completa a frase, tipo
  "Testamento fora da alçada", é montado por quem consome, não pelo enum em si).
- **`entities/protocolo`** — `AlcadaConferente` (painel de detalhe) virou um alias de
  `AvaliacaoAlcada` (`entities/regraAlcada`) em vez de um tipo próprio com `regraEtapaId`/
  `regraTipoId` separados — o motor v3 já não tem essa distinção. Primeiro cruzamento de import
  nessa direção entre os dois (regraAlcada já importava de protocolo pro lado de `Etapa`) —
  `import type` nos dois sentidos, sem problema de ciclo real (tipo é apagado em tempo de
  build). `PainelDetalheProtocolo.tsx` ganhou o texto de `motivo` (`MOTIVO_ALCADA_LABEL`) ao
  lado de quem está barrado, de graça — antes só mostrava "barrado" sem dizer por quê.

**Duas rodadas de ajuste de fidelidade depois do primeiro corte, a pedido do dono**:

- Removido o botão "Novo tipo de ato" do cabeçalho da aba Alçada (sobrou do corte anterior,
  antes de "Tipos de ato" virar aba própria) — o protótipo só tem "Nova regra" ali; "Tipos de
  ato" já tem seu próprio diálogo de criação, então não perdeu funcionalidade nenhuma.
- **`SeletorUnico.tsx`/`SeletorMultiplo.tsx`** (novos, `central-de-regras-board/ui/`) — o
  construtor guiado (RF-32) tinha duas paredes de pills que não escalavam bem (até 24 tipos de
  ato de uma vez, ou um pill por conferente): "Quem" (o nível/pessoa específico) e o valor do
  alvo (tipos/etapas/equipes/grupos) viraram dropdowns com busca, padronizando com dois padrões
  que já existiam em outros cantos do app — `SeletorConferente` (fila-conferentes: Popover +
  trigger + indicador de seleção único) e `FiltroEixo` (widgets/filtro-protocolos: Popover +
  busca + checkbox múltiplo). Isso não veio do `Dispatch.dc.html` — **busquei o texto exato
  dos prints que o dono mandou (`buscar conferente ou nível…`, `escolher o que…`) no arquivo
  inteiro e não achei nada**; o construtor lá continua sendo pills. É uma melhoria de
  consistência interna do próprio app (reaproveitar um padrão já validado em duas telas
  diferentes), não fidelidade a uma tela nova do protótipo — documentado aqui pra não passar a
  impressão de que foi confirmado contra o `.dc.html`, que não foi. "Permissão" (pode/não
  pode/reserva) também virou o mesmo tipo de dropdown, a pedido explícito do dono ("pra ficar
  padronizado ali") — os pills de tipo de alvo (grupo/tipo/etapa/equipe/todos) continuam pills,
  só o valor final de cada eixo é que virou dropdown.

**Achado no meio da verificação, não é bug de código**: a Matriz ficou com as colunas de
conferente todas coladas (cabeçalho "AglaConfConfMarcMariMathNubySuel" sem espaço nenhum) na
primeira rodada de screenshot — o dev server do Vite (rodando desde muito antes desses arquivos
existirem) não tinha recompilado o CSS do Tailwind pras classes de largura novas (`w-11`,
`w-[220px]`) ainda, mesmo com HMR ativo. `document.styleSheets` no browser confirmou a regra
ausente; reiniciar `npm run dev` resolveu na hora. Lição: se uma classe Tailwind nova (largura/
grid arbitrária, principalmente) parecer "não fazer nada" num dev server de sessão longa,
reiniciar o Vite antes de desconfiar do código.

Verificado nos dois temas via `verify-visual` (`e2e/alcada-v3.spec.ts`, novo): as 3 sub-abas
com dado real (regra de nível, regra de equipe, exceção pessoal, reserva e grupo criadas via
API pra este teste, removidas depois), frase de reserva ("Só Marcio Santos confere Divórcio Com
Partilha") e de grupo renderizando certo na aba Camadas, matriz expandindo grupo e mostrando
tipo individual, simulador "Testar" com um caso reservado mostrando a trilha completa (Reserva
→ Base por nível → Exceção por pessoa pra quem tem, "reservado a outra pessoa" pra todo mundo
mais) — bateu exatamente com o que `POST /regras-alcada/testar` devolveu, conferido também via
`curl` direto antes de confiar no render. Regressão permanente (`auth`/`session-isolation`/
`cursor`/`login`) verde depois da mudança.

## Pool ordenado + "+N protocolos" em Minha fila

Pool de Distribuição e de Minha fila já vem ordenado por vencimento do back (ver CLAUDE.md do
`dispatch-api`, mesma seção) — nenhuma mudança de front precisou pra isso, `.filter()` do
`useFiltroProtocolos` preserva ordem.

**`ListaCompletaPoolSheet.tsx`** (novo, `widgets/minha-fila-board/ui/`) — "Pool disponível"
de Minha fila ganhou o mesmo truncamento em 3 + "+N protocolos" que a coluna "Pool aberto" de
Distribuição já tinha (`ProtocoloColuna`/`ListaCompletaColunaSheet`), só que reaproveitando
`ProtocoloCard` (não o card de Distribuição, que mostra tipo/escrevente/equipe que Minha fila
não usa) — mesmo Sheet exportado pelo barrel de `minha-fila-board` e reaproveitado por
`MinhaFilaBoard` (com `onAcao`, "Pegar este" funciona dentro do Sheet também) e
`FilaDoConferenteBoard` (`somenteLeitura`, sem ação — a Distribuidora só olha a fila de outro
conferente, RNF-04).

Verificado nos dois temas: pool com 16 itens, 3 visíveis + "+13 protocolos", Sheet abrindo com
a lista completa ordenada (mais vencido no topo) e "Pegar este" funcionando de dentro do Sheet.
Regressão permanente (`fila-conferentes`/`conferentes`/`auth`/`session-isolation`/`cursor`/
`login`) verde.

**Ajustes a pedido do dono, mesma rodada**:

- Limite de truncamento subiu de 3 pra 5 em `ProtocoloColuna.tsx` (variant "conferente", usada
  por "Pool aberto"/colunas de Distribuição) e `MAX_POOL_VISIVEL` de `MinhaFilaBoard.tsx`/
  `FilaDoConferenteBoard.tsx`.
- **Achado real comparando ao vivo com o protótipo**: o card de Minha fila (`ProtocoloCard.tsx`)
  não mostrava tipo de ato/escrevente/equipe — a "simplificação consciente" documentada desde a
  construção de Minha fila ("RF-14 é só de Distribuição") ficou **desatualizada**: o protótipo
  v2 passou a mostrar isso ali também (tipo de ato, chips de equipe+etapa lado a lado, nome do
  escrevente), achado só ao navegar o protótipo ao vivo lado a lado com o app, não por suposição.
  `ProtocoloCard` ganhou `info: InfoProtocolo` (mesmo tipo já usado em Distribuição) — layout
  muda um pouco do de lá: aqui a etapa também vira `Chip` (não texto solto), lado a lado com o
  chip de equipe, já que o protótipo mostra os dois como pills na mesma linha aqui.
  `resolverInfoProtocolo` em `MinhaFilaBoard`/`FilaDoConferenteBoard` deixou de sempre devolver
  `tipoAtoNome: null` — agora resolve de verdade via `useTiposAto()` (já buscado pro filtro,
  só não era usado pro card ainda). `ListaCompletaPoolSheet` ganhou a prop `resolverInfo`
  pra repassar adiante. Verificado nos dois temas.

**`DistribuicaoProtocoloCard.tsx`/`ListaCompletaColunaSheet.tsx` compactados, mesmo pedido**:
a linha de escrevente+equipe usava um `Chip` cheio pra equipe (fundo+borda), numa linha
própria, separada da etapa — o protótipo mostra tudo isso como texto corrido numa linha só
("Escrevente · Equipe · Etapa"), sem pill. Trocado `Chip` por `<span>` com `text-bad-fg`
condicional (equipe nula = vermelho, igual antes, só sem o fundo/borda da pill) e a etapa
juntou na mesma linha pra variant "conferente" (na variant "status" a etapa não aparecia nessa
linha mesmo antes — quem mostra lá é o nome do dono, numa linha própria, isso não mudou).
Verificado nos dois temas e nas duas abas (Por conferente/Por status).

**Segunda rodada de fidelidade no mesmo card, a pedido do dono ("nome do escrevente muito
grande, dá pra truncar")** — desta vez fui direto no markup do `Dispatch.dc.html` em vez de
comparar só visualmente (`p.tipo`/`p.meta`, linhas ~375-378 e ~1621-1624 do arquivo), porque a
essa altura eyeballing screenshot já tinha errado uma vez. Achados **confirmados no CSS
inline do protótipo, não aproximados**:

- `p.meta` (a linha "escrevente · equipe · etapa") é `overflow:hidden;text-overflow:ellipsis;
white-space:nowrap` — uma linha só, truncada com reticências — **não** `text-wrap:pretty`
  como eu tinha usado. Isso é o que fazia o card "crescer" quando o nome do escrevente era
  longo: a linha quebrava em 2-3 linhas em vez de truncar. Corrigido em
  `DistribuicaoProtocoloCard.tsx` e no item da lista de `ListaCompletaColunaSheet.tsx`
  (mesmo padrão no protótipo, linha ~1624) — os dois ganharam `overflow-hidden text-ellipsis
whitespace-nowrap` + `title` com o texto completo (tooltip nativo do browser), preservando
  o acesso ao nome inteiro sem inventar um componente de tooltip novo pra isso.
- **Divergência deliberada de RNF-10 aqui, registrada**: RNF-10 pede nome sem truncar "em tela
  cuja função é distinguir registros parecidos" (catálogo, listas) — mas esta linha é dado
  auxiliar dentro de um card operacional (RF-13), não uma lista cujo propósito é
  desambiguar registros; o próprio protótipo aprovado trunca aqui. `title` cobre o caso de
  precisar ver o nome completo sem reabrir a decisão de RNF-10 nos lugares onde ela
  efetivamente se aplica (Conferentes, Tipos de ato — nenhum dos dois mudou).
- `p.tipo` tinha tamanho/cor errados por aproximação: protótipo usa `font-size:12.5px;
color:var(--text-5)` em Distribuição (eu tinha `11.5px`/`text-text-2`) e `font-size:13px;
color:var(--text-5)` em Minha fila (essa already batia). Corrigido nos dois cards + no item
  da lista completa (`13px`, também truncado no protótipo, `overflow-hidden text-ellipsis
whitespace-nowrap` lá também). Escrevente de Minha fila (`ProtocoloCard.tsx`) tinha
  `12px`; protótipo usa `11.5px` — corrigido. **Não truncado** em Minha fila: o protótipo não
  tem `overflow`/`ellipsis` na linha do escrevente lá (`p.escrevLabel`, sozinho, sem juntar
  com equipe/etapa que já são pills separadas) — só Distribuição junta os 3 campos numa
  string só e trunca.
- **Não mexido de propósito**: o `Chip` compartilhado (`shared/ui/chip.tsx`, `font-mono
text-[11px]`) usado nas pills de prazo/equipe/etapa em todo o app — o protótipo usa
  `10.5px` sem mono pras pills de equipe/etapa especificamente, mas mudar o componente
  compartilhado afetaria dezenas de usos já verificados (prazo em toda tela, "urgente",
  etc.); risco desproporcional ao pedido, que era especificamente sobre o nome do
  escrevente. Fica registrado como gap conhecido, não esquecido.

## Painel de Filtros (RF-18e/RF-24f) redesenhado — protótipo reexportado com fluxo novo

O dono reexportou `dispatch-prototype/` (todos os 6 arquivos, `Sep 1 10:30`) e avisou "tem um
fluxo novo, dá uma olhada". Achado ao ler o `Dispatch.dc.html` de novo do zero (não só
screenshot): um componente novo, `Combo.dc.html` (não existia antes) — um seletor com busca
reutilizável (gatilho compacto, popover com busca ignorando acento, lista rolável com marcação,
contagem de opções, "Limpar" na multisseleção) — é literalmente RNF-11 implementado como
componente de verdade pela primeira vez, não só descrito em texto. Os 4 eixos de filtro de
Distribuição e Minha fila (RF-18e/RF-24f), que antes eram uma barra fixa inline sempre visível,
viraram um painel deslizante ("Filtros", com badge de contagem) — cada eixo um `Combo`. Junto
disso, dois campos novos direto no toolbar, fora do painel: busca livre (protocolo, tipo,
escrevente, equipe, observação) e filtro por dia do vencimento — nenhum dos dois existia antes.
Confirmado lendo `passaFiltro`/`grupoFiltros`/`painelGrupos` (~linhas 2716-2761, 3352-3373,
3504-3512 do `Dispatch.dc.html`) e navegando o protótipo ao vivo (`file://`) — não só o markup.

**Achado extra, corrigindo uma decisão anterior**: o eixo "Prazo" já existia no app, mas como
multisseleção das 4 faixas do semáforo (Verde/Amarelo/Laranja/Vermelho) — uma leitura de
`filtros.ts` documentava isso como decisão consciente ("o exemplo do requisito é uma
combinação, não um eixo"). Lendo `passaFiltro` de verdade (`f.urgentes`) ficou claro que o
protótipo trata "Prazo" como **um único alternador**: "só urgentes e vencendo em 4h"
(prioridade Alta OU vence em menos de 4h a partir de agora) — exatamente o texto literal do
RF-18e, não uma combinação de exemplo. `FiltroProtocolo.faixasSemaforo: FaixaSemaforo[]` virou
`urgente: boolean`; `protocoloPassaNoFiltro` ganhou parâmetro `now` só pra esse cálculo.

**Implementação**:

- `entities/protocolo/lib/filtros.ts` — `FiltroProtocolo` ganhou `texto`, `data` (chave
  `"yyyy-mm-dd"` do dia local do vencimento) e trocou `faixasSemaforo` por `urgente`.
  `contagemFiltrosAtivos` continua só os 4 eixos combináveis (equipe/tipo/prioridade/urgente) —
  `texto`/`data` não contam no badge, igual o protótipo (`contaGestao`/`contaFila` também não
  somam `busca`/`data`).
- `widgets/filtro-protocolos/ui/FiltroEixo.tsx` — reescrito de dropdown-com-badge-de-eixo pra
  um `Combo` de verdade: todo eixo agora tem busca (ignora acento, mesma normalização NFD do
  `Combo.dc.html`), o rótulo do gatilho reflete a seleção ("todos" / nome único / "N
  selecionados"), rodapé com contagem de opções e "Limpar".
- `widgets/filtro-protocolos/ui/PainelFiltros.tsx` (novo) — o `Sheet` com os 4 grupos
  (Equipe do escrevente/Tipo de ato/Prioridade/Prazo), cada um rótulo+contagem "N de M" acima
  de um `FiltroEixo`. **"Prazo" também é um `FiltroEixo`** (uma única opção dentro), não um
  checkbox solto — o protótipo trata os 4 grupos de forma uniforme (`painelGrupos` mapeia
  todos pelo mesmo `dc-import Combo`), então replicado igual mesmo parecendo redundante pra um
  grupo de 1 opção só.
- `widgets/filtro-protocolos/ui/BarraDeFiltros.tsx` — virou o toolbar inteiro: busca livre +
  `DatePicker` + botão "Filtros" (com badge, abre o `PainelFiltros`). Antes só continha os
  dropdowns dos eixos.
- `shared/ui/date-picker.tsx` (novo) — `Popover`+`Calendar` nullable com "Limpar", mesmo
  padrão visual do `DateTimePicker` já existente (JetBrains Mono nos dias, letra maiúscula de
  dia da semana) mas sem hora. **Divergência deliberada do protótipo**: lá o campo de data é um
  `<input type="date">` nativo do browser (confirmado ao vivo, mostra `mm/dd/yyyy` do Chrome)
  — isso contraria RNF-07 ("nenhum controle nativo... select, data, hora"), então segui o
  requisito formal em vez do atalho do protótipo, mesmo padrão já adotado pro `DateTimePicker`
  no fluxo de importação.
- `DistribuicaoBoard.tsx`/`MinhaFilaBoard.tsx`/`FilaDoConferenteBoard.tsx` — a legenda "Prazo do
  ato" e o `BarraDeFiltros` deixaram de dividir a mesma linha (`justify-between`) e viraram duas
  linhas empilhadas, igual o protótipo (linha da legenda, depois linha de busca+data+Filtros).
  `useFiltroProtocolos` passou a receber `now` (as 3 telas já tinham via `useNow()`).

Verificado nos dois temas via Playwright (`file://` do protótipo lado a lado com o app rodando
localmente): toolbar, painel aberto, busca dentro de um eixo (accent-insensitive confirmado —
"venda" acha "Venda e Compra"), badge de contagem (ignora busca livre/data, só eixos), busca
livre combinada com eixo marcado, `DatePicker`. Suíte permanente (`auth`, `session-isolation`,
`cursor`, `login`, `fila-conferentes`, `conferentes`) verde depois da mudança.

## Cumprimento de prazo por equipe — fecha metade do gap do RF-43 no front

Consome o campo novo `cumprimentoPrazoEquipe` do `GET /dashboard` (ver `dispatch-api/CLAUDE.md`,
mesma seção). Aproveitando a mudança, `VisaoGestao.tsx` também corrigiu um gap de fidelidade que
já existia antes desta rodada: "Desempenho por tipo de ato" era renderizado como uma `Table`
cheia, largura total — o protótipo aprovado (`Dispatch.dc.html`, `gridDois`, linhas ~1568-1600)
sempre mostrou os dois blocos ("Cumprimento de prazo por equipe" e "Por tipo de ato", esse
último com esse rótulo exato, não "Desempenho por tipo de ato") lado a lado, num grid de 2
colunas, em cards compactos sem borda de tabela — divisor simples entre linhas (`border-t`), não
`<table>`. Os dois blocos foram reconstruídos juntos nesse estilo (`grid grid-cols-1
md:grid-cols-2 gap-2`), confirmado direto no markup do protótipo, não por aproximação visual.

**Cores/limiares da barra "cumprimento de prazo"**: `>=90%` ok (verde), `>=70%` atenção
(amarelo), abaixo disso vencido (vermelho) — mesmos limiares do protótipo (`slaEquipes`,
`x.noPrazo >= 0.9`/`>= 0.7`) e mesmos tokens já usados no resto do app pras faixas do semáforo
(`bg-ok-bar`/`bg-warn-bar`/`bg-bad-bar`, `text-ok-fg`/`text-warn-fg`/`text-bad-fg` — já existiam
em `app/styles/index.css`, nenhum token novo precisou entrar). Linha ordenada por pior
percentual primeiro (o back já manda ordenado, `OrderBy(PercentualNoPrazo)` — o front só
itera). Rótulo "N atos" sem singular/plural (`1 atos`) é fidelidade ao protótipo, que também não
trata singular ali (`x.total + ' atos'`) — não é bug.

`entities/dashboard` ganhou o tipo `CumprimentoPrazoEquipe` (campo `equipeId: string | null` —
`null` é "sem equipe", mesmo padrão de `InfoProtocolo.equipeId`); `ETAPA_LABEL`/`TIPO_PRAZO_LABEL`
reaproveitados de `entities/protocolo` (já existiam, minúsculos, batendo com o texto do
protótipo "pós-conferência · D+1" sem precisar de rótulo novo).

**Dado de teste criado pra verificar visualmente** (banco local, não produção): 3 protocolos
avulsos via `/protocolos/distribuir` (dois com o mesmo escrevente de uma equipe cadastrada,
etapas diferentes — pra aparecer mais de uma linha da mesma equipe; um com escrevente novo sem
equipe), atribuídos e concluídos via o fluxo real de Minha fila (pegar/iniciar/concluir) logado
como o conferente de teste `conferente-rf27@cartorio.com`. Sem endpoint de excluir protocolo
ainda (RF-18i não implementado) — ficam no banco local, sem risco (não é produção).

Suíte permanente + `e2e/dashboard.spec.ts` rodada depois da mudança: a assertion do texto do
card precisou de ajuste (`"Desempenho por tipo de ato"` → `"Por tipo de ato"` + nova assertion
de `"Cumprimento de prazo por equipe"`) — mudança esperada, não regressão, já que o rótulo do
card mudou de propósito pra bater com o protótipo. O segundo teste do arquivo (visão conferente,
conta `conferente-visual@cartorio.com`) continua falhando por motivo **pré-existente e
documentado no próprio arquivo de teste**: essa conta não tem nenhum protocolo concluído no
banco local (confirmado via `GET /dashboard` direto, `desempenho: []` em qualquer período) —
não é regressão desta mudança.

## "Concluídos hoje" de Minha fila — card divergia bastante do protótipo (achado pelo dono)

O dono relatou "fonte estranha em alguns lugares do Minha fila". Investigando ao vivo (não por
memória de sessão anterior) achei o card de `ConcluidosHojeList.tsx` bem mais divergente do
protótipo do que só tipografia — releitura direta do markup (`Dispatch.dc.html`, `feitosCards`,
linhas ~833-861):

- **Faltava a linha de tipo de ato.** O card só mostrava número/status na primeira linha e ia
  direto pra ação — sem `info`/`resolverInfo` nenhum passado pro componente. Ganhou
  `nomePorTipoAtoId: Map<string, string>` (mesmo padrão de "back manda o fato cru, front
  resolve o nome" já usado no resto do app), numa segunda linha junto da duração.
- **O texto "estranho" era a causa raiz real**: `janela de correção encerrada` estava em
  `font-mono text-[10.5px]`, sozinho, sem contexto — no protótipo esse texto (`janelaLabel`)
  só existe dentro do estado "ainda dá pra corrigir", sempre prefixado por `"MARCOU ERRADO? · "`
  (um rótulo eyebrow, maiúsculo, mono — o mesmo padrão já usado em "OBSERVAÇÃO" no painel de
  detalhe). Sem o prefixo, virava uma frase solta numa fonte tabular, o que de fato lê estranho
  — e quebrava em 2 linhas feio no card estreito. **Pior ainda**: no estado "janela encerrada,
  ainda não pediu reabertura", o protótipo **não mostra nenhum texto** — só o botão fantasma
  "Pedir reabertura à distribuidora" sozinho. O app antigo mostrava "janela de correção
  encerrada" nesse estado também, um texto que o protótipo aprovado nunca exibe ali.
- **Faltava o indicador "resultado já corrigido uma vez"** (`p.corrigido`) — o campo
  `corrigidoEm` já vinha da API (`ProtocoloConcluidoResumo`), só não era lido pelo componente.
- **Status virou pill de verdade** (`Chip` com `tom="ok"`/`tom="vencido"`) — antes era só texto
  colorido sem fundo/borda; o protótipo usa uma pill cheia (`bg`+`border`+`color`) igual o resto
  do app já faz pra prazo/urgente.
- **Ações reorganizadas de linha única (`justify-between`, texto+botão lado a lado) pra
  empilhadas** — protótipo sempre põe o rótulo/aviso numa linha e o botão cheio (`width:100%`)
  embaixo, nos três estados (pedido pendente, ainda corrige, janela encerrada).

**Não mexido nesta rodada, gap separado e maior**: RF-24e (clicar no card abre o painel de
detalhe do protocolo) simplesmente não existe em nenhuma coluna de Minha fila — nem esta nem as
outras três. Precisaria wire-up de `PainelDetalheProtocolo` no board inteiro, escopo bem maior
que o pedido original ("fonte estranha"); registrado aqui como próximo passo, não esquecido.

Verificado nos dois temas, e nos três estados reais (janela aberta criando um protocolo e
concluindo na hora; janela encerrada com os concluídos já existentes no banco local) — dado
criado via o mesmo fluxo real de Minha fila (pegar/iniciar/concluir), não mock. Suíte
permanente + `e2e/minha-fila.spec.ts`/`dashboard.spec.ts` rodadas depois, nada quebrou (mesma
falha pré-existente e documentada de antes, não relacionada).

## Protocolo manual — criar, editar, excluir com desfazer (RF-18f a RF-18j)

Front do que ficou pendente no `dispatch-api` (mesma seção lá) depois do dono notar o botão
"Novo protocolo" do protótipo, que nunca existia no app.

- **`shared/ui/seletor-unico.tsx`/`pill-toggle.tsx`** (movidos de `central-de-regras-board/ui/`,
  sem mudança de comportamento pros 6 usos existentes) — passam a ser reaproveitados fora da
  Central de Regras pela primeira vez. `SeletorUnico` ganhou `permiteValorLivre?: boolean`
  (RF-09: o campo de escrevente do modal precisa aceitar um nome que ainda não existe no
  cadastro — quando a busca não bate com nenhuma opção, uma linha extra "usar «busca»" aparece
  e vira o valor direto).
- **`shared/ui/sonner.tsx`** (novo, via skill `add-shadcn-component`) — o gerador do shadcn
  assume `next-themes` (Next.js); este projeto não usa Next, então trocado por `useThemeStore`
  (o mesmo Zustand store do alternador de tema da sidebar) — sem essa troca o toast ficaria
  sempre no tema "system", ignorando a troca manual do usuário. Dependência `next-themes`
  removida do `package.json` (só existia por causa do arquivo gerado, nada mais no projeto
  usava). `<Toaster />` montado uma vez em `app/providers/app-providers.tsx`.
- **`shared/ui/alert-dialog.tsx`** (novo, via skill) — confirmação de exclusão (RF-18i), sem
  gotcha nenhum (componente padrão, sem dependência de Next).
- **`widgets/protocolo-manual/ui/ProtocoloManualDialog.tsx`** (novo) — um componente só serve
  "Novo protocolo" (Distribuição) e "Editar protocolo" (painel de detalhe); a diferença é só a
  prop `protocoloParaEditar` (presente = edição, pré-preenche o formulário). Prévia ao vivo
  (equipe, prazo, grupo do ato, destino previsto) via `useSimularProtocoloManual`
  (`entities/protocolo`) — dispara só quando tipo e escrevente já estão preenchidos, sem
  persistir nada (RF-18f: "o modal mostra, antes de confirmar..."). Prioridade fica em 2 níveis
  (Normal/Alta), não os 3 do rascunho do protótipo (Alta/Média/Baixa) — o domínio já só suporta
  2 desde o RF-18a ("marcar como urgente"), não reabri essa discussão aqui.
- **Bug real achado testando o fluxo de verdade, não pelos tipos**: `useCriarProtocoloManual`/
  `useEditarProtocoloManual` só invalidavam a visão de Distribuição — um escrevente novo criado
  junto (RF-09) ficava fora do cache de `/escreventes` (`staleTime` 60s) até expirar sozinho,
  então reabrir o mesmo protocolo pra editar mostrava o campo Escrevente vazio (achado: o
  `useEffect` que pré-preenche o formulário de edição não tinha `escreventes` nas dependências,
  então nem recalculava quando a lista finalmente chegava — duas causas empilhadas do mesmo
  sintoma). Corrigido nos dois lugares: as mutations agora invalidam `ESCREVENTES_QUERY_KEY`
  também, e o `useEffect` do modal ganhou `!!escreventes` na lista de dependências.
- **`PainelDetalheProtocolo.tsx`** ganhou "Editar protocolo" (abre o mesmo modal) e "Excluir"
  (abre `AlertDialog` com aviso condizente ao status — "Conferindo" avisa que interrompe quem
  está com o ato, "Atribuido" avisa de quem sai da fila) numa seção separada das ações de
  status (`border-t`), já que editar/excluir valem pra qualquer protocolo, não dependem do
  estado atual. Excluir fecha o painel e dispara o toast de desfazer
  (`sonner`, `action: { label: 'Desfazer', onClick: () => restaurar.mutate(id) }`,
  `duration: 8000`).
- **`DistribuicaoPage.tsx`** ganhou o botão "Novo protocolo" no toolbar, entre "Redistribuir
  pool" e "Importar relatório" (mesma ordem do protótipo).

Testado ponta a ponta via Playwright contra a API local (não só tsc/build): criar (prévia ao
vivo, escrevente novo via "usar «nome»", protocolo aparece na Distribuição), abrir o detalhe e
editar (troca de etapa recalcula o vencimento — confirmado comparando os valores antes/depois),
excluir (some da tela, toast aparece com o número certo), desfazer (protocolo volta com a
mesma etapa/tipo/escrevente da última edição — soft-delete no back preserva tudo). Suíte
permanente rodada depois, verde (mesma falha pré-existente já documentada).

## Login — mostrar/ocultar senha

Pedido direto do dono. Ícone (`lucide-react`, `EyeIcon`/`EyeOffIcon`) dentro do campo,
alternando `type="password"`/`type="text"`. **Achado testando a suíte, não óbvio de antemão**:
`aria-label="Mostrar senha"` no botão colidia com `page.getByLabel('Senha')` (usado em quase
todo teste e2e que loga) — `getByLabel` do Playwright também acha elemento com `aria-label`
batendo, não só `<label>` de verdade, então virava "2 elementos" e quebrava a suíte inteira.
`aria-label` renomeado pra "Mostrar/ocultar caracteres digitados" (evita a palavra "senha" de
propósito) — mesma função pra leitor de tela, sem colidir com os testes.

## Modal de protocolo manual — segunda passada de fidelidade

O dono perguntou diretamente "está fiel ao protótipo 100%?" — releitura do markup de
`novoAberto` (`Dispatch.dc.html`, linhas ~1739-1808), não da memória da sessão, achou vários
gaps reais:

- **Observação faltava no "Criar"** (só existia no modo editar) — o back nem aceitava esse
  campo na criação (ver `dispatch-api/CLAUDE.md`, mesma seção). Corrigido dos dois lados; o
  campo agora aparece sempre, igual o protótipo.
- **`SeletorUnico` ganhou `sub?: string`** — os dois pickers deste modal (tipo de ato, grupo;
  escrevente, equipe) mostram a segunda linha que o `Combo` do protótipo sempre mostrou e que
  faltava aqui.
- **"Excluir" dentro do modal de edição** — o protótipo tem essa ação redundante com a do
  painel de detalhe (`novo.excluirDoModal`). `ProtocoloManualDialog` ganhou
  `onPedirExclusao?: () => void` (só usado em modo edição); `PainelDetalheProtocolo` passa uma
  função que fecha o modal de editar e abre o `AlertDialog` de confirmação que ele já tinha.
- **Rodapé virou `justify-between`** — Cancelar+Excluir agrupados à esquerda, Criar/Salvar à
  direita, igual o protótipo (`DialogFooter` do shadcn é `justify-end` por padrão).
- **Eyebrow "O QUE O SISTEMA VAI FAZER"** acima da prévia — faltava o rótulo, só o conteúdo.
- **Textos de ajuda** — "só tipos já cadastrados — sem opção de criar um novo por aqui" no
  campo de tipo de ato (honesto sobre uma divergência real, ver abaixo) e placeholder da
  Observação copiado do protótipo ("opcional — o conferente vê isso no card").
- **Modal com 520px** (`sm:max-w-[520px]`) — o padrão do `DialogContent` é `sm:max-w-sm`
  (~384px), bem mais estreito que o protótipo.

**Duas divergências reais, mantidas conscientemente, não "corrigidas" às pressas**:

- **Prioridade tem 2 níveis (Normal/Alta), não os 3 do protótipo** (Alta/Média/Baixa) — o
  domínio do back só suporta 2 desde antes desta sessão (RF-18a, "marcar como
  urgente"/"remover urgência" já era binário). Ampliar pra 3 é mudança de `enum Prioridade` em
  toda a aplicação, não uma correção de modal — fica registrado, não silenciado.
- **Tipo de ato não aceita nome livre** — o protótipo deixa digitar um tipo fora da lista
  ("tipo fora da lista entra como novo e cai em exceções"); o back (`CriarProtocoloManual`/
  `EditarProtocoloManual`/`SimularProtocoloManual`) só aceita `tipoAtoId: Guid` de um tipo já
  cadastrado — diferente de escrevente, que resolve por nome com criação automática
  (`ResolvedorDeEscreventePorNome`), tipo de ato nunca teve esse caminho pro fluxo manual.
  Adicionar isso é mudança de arquitetura (o "tipo desconhecido" hoje só nasce via
  `ImportarLote`), não front — fica como próximo passo explícito, não escondido atrás de um
  "está tudo pronto".

Verificado nos dois temas via Playwright: modal vazio e preenchido (sub-labels aparecendo nos
dois seletores, prévia com eyebrow), editar mostrando "Excluir" no rodapé. Suíte permanente
rodada de novo, verde (mesma falha pré-existente).

## Card do quadro quebrava com prioridade Alta — achado pelo dono ao vivo, não pelos testes

O dono mandou print mostrando o card de "263546" (prioridade Alta) com a linha do
número/badges estourando a largura da coluna — layout visualmente quebrado, coisa que nenhum
`verify-visual` anterior tinha pego (nenhum protocolo de teste tinha prioridade Alta na hora
das verificações).

Investigando (releitura direta do `Dispatch.dc.html`, não memória), achei a causa: o badge de
prioridade Alta que eu tinha posto (`DistribuicaoProtocoloCard.tsx`) estava **na linha errada
E com o rótulo errado**. Confirmado no protótipo (linhas ~370-379): a primeira linha do card é
só número + chip de prazo (`justify-between`, sem espaço pra mais nada) — o indicador de
prioridade alta fica na **terceira linha**, junto da meta de escrevente/equipe/etapa
(`p.alta` ao lado de `p.meta`, `display:flex;gap:6px`), com o rótulo **"Alta"**, não "urgente"
(que eu tinha inventado sem checar o protótipo). Mesmo padrão confirmado na lista completa da
coluna (linhas ~1620-1631, `ListaCompletaColunaSheet.tsx`), que nem tinha indicador nenhum de
prioridade antes — também corrigido, mesma posição/rótulo.

Badge próprio (não o `Chip` compartilhado) pra bater exato com o protótipo: `10.5px`,
`font-weight:600`, `border-bad-border`/`bg-bad-bg`/`text-bad-fg`, `rounded-full` — o `Chip` é
`font-mono text-[11px]`, e não fazia sentido arrastar essa mudança de fonte pro badge só por
causa deste caso (mesmo raciocínio já registrado antes sobre não mexer no `Chip` compartilhado
por um pedido pontual).

Verificado nos dois temas, marcando um protocolo real como Alta via
`POST /protocolos/{id}/definir-prioridade` e conferindo os dois lugares (card do quadro, item
da lista completa) — sem quebra de layout, badge na linha certa.

## TOTP e recuperação de senha, caminho feliz (RF-01a a RF-01l)

Duas telas públicas novas, consumindo o back que acabou de ganhar `POST /auth/totp/registrar`,
`POST /auth/totp/confirmar`, `POST /auth/recuperar/iniciar`, `POST /auth/recuperar/validar-codigo`,
`POST /auth/recuperar/redefinir-senha` (ver `dispatch-api/CLAUDE.md` pra todo o desenho de
back). RF-01m/RF-01n (liberação sem autenticador, códigos de admin) ficam de fora, por decisão
explícita do dono — nem o link "Não tenho o app" do protótipo foi construído, de propósito.

**Layout: card único centralizado, não o split de duas colunas do `/login`** — confirmado
relendo o `Dispatch.dc.html` direto (`isTotp`/`isRec`, não `isLogin`): as duas telas usam o
mesmo shell (crachá pequeno + wordmark acima de um card branco/superfície, `max-width` 428-452px,
sobre `var(--bg)` plano). `Logo` ganhou um terceiro tamanho (`size="md"`, 30px) só pra bater
exato com esse crachá — o protótipo usa 30px aqui contra 44px do login e 26px do resto do app,
não é um dos dois tamanhos que já existiam.

**Divergência necessária do protótipo — "Registrar autenticador" não pula direto pro QR.** No
protótipo (mock, sem back de verdade) o botão da tela de login vai direto pra tela do QR, sem
pedir senha. Isso não é seguro nem faz sentido com um back real: `POST /auth/totp/registrar` é
autenticado de propósito (RF-01a associar o segredo a uma conta exige provar que é o dono dela
— senão qualquer um registraria um autenticador pra e-mail alheio). `RegistrarTotpPage`
resolve isso reaproveitando o próprio `<LoginForm/>` como portão: sem sessão, mostra o login;
assim que a sessão existe (`useSessionStore`), troca pro QR/confirmação, sem navegar pra outro
lugar. `LoginForm` ganhou a prop `mostrarLinksAuxiliares` (default `true`) só pra não repetir
"Esqueci minha senha"/"Registrar autenticador" dentro da própria tela de registrar quando
embutido assim.

**QR de verdade, renderizado no cliente** — `qrcode.react` (`<QRCodeSVG value={uriOtpAuth} />`),
nova dependência (nenhuma lib de QR existia no projeto). Servidor nunca gera imagem — só devolve
a URI `otpauth://` crua, RF-01b permite os dois, cliente é mais simples aqui. Chave também
mostrada em texto, quebrada em blocos de 4 (`chaveBase32.match(/.{1,4}/g)`), igual ao protótipo.

**Contador de 30s do passo "código" é cosmético, calculado no cliente** (`30 - (Math.floor(Date.now()/1000) % 30)`,
`setInterval` de 1s só enquanto esse passo está ativo) — não depende do back pra nada, é só
lembrar visualmente que o código muda a cada 30s (mesmo raciocínio do protótipo).

**Regras de senha replicadas no cliente pra feedback ao vivo** (mesmas 3 do
`Dispatch.Domain.RegrasDeSenha`: 12+ caracteres, não começar com `senha|123|cartorio|dispatch`,
as duas iguais) — o back segue sendo a fonte da verdade (front pode divergir por bug, back
nunca aceita senha fraca).

**Bug real de infra achado construindo isto**: `POST /auth/recuperar/validar-codigo` e
`POST /auth/recuperar/redefinir-senha` são anônimos e devolvem 401 pra "código errado"/"token
inválido" — resultado de negócio normal, não sessão morta. O `httpClient` compartilhado
(`shared/api/http-client.ts`) trata **qualquer** 401 como "sessão expirou" (`onUnauthorized`:
limpa `useSessionStore` + `queryClient.clear()`) — sem tratamento especial, testar a
recuperação de senha em uma aba enquanto outra conta está logada no mesmo navegador limparia a
sessão de quem está logado, por um 401 que não tem nada a ver com ela. Corrigido com um
opt-out mínimo: `AxiosRequestConfig.ignorarSessaoEncerrada`, checado no interceptor de resposta
antes de chamar `onUnauthorized`, usado só nesses dois `httpClient.post(...)`.

**RNF-04 (tema) — decisão revertida durante a implementação, com evidência nova.** O plano
inicial assumia (com base numa investigação anterior) que valeria a pena adicionar um botão de
trocar tema nessas telas, já que o protótipo não tem um ali mas o RNF pede "disponível antes e
depois do login". Investigação fresca do código (não da memória) mostrou que **a tela de login
atual também não tem esse botão** — `useThemeStore` só é consumido em `AppShell` (sidebar
autenticada) e `shared/ui/sonner.tsx`; o tema em `/login` só segue o que já estava persistido
(ou `prefers-color-scheme`), sem controle nenhum na tela. Adicionar um toggle só nas duas telas
novas, e não no login (a mais importante das três), seria inconsistente e vistoso — as duas
telas novas seguem exatamente o mesmo comportamento real do `/login`: sem toggle próprio, tema
herdado.

**`e2e/totp-recuperacao-senha.spec.ts`, TOTP de verdade, sem mock** — gera um segredo, computa
o código RFC 6238 na mão em Node (`node:crypto`, HMAC-SHA1, sem lib nova só pro teste), extrai
a chave Base32 exibida na tela, confirma o registro, depois roda a recuperação completa até
trocar a senha de verdade e logar com ela. Cria e remove um conferente de teste (mesma
convenção de `conferentes.spec.ts`) — não pode reusar a conta seed fixa porque o fluxo troca a
senha dela.

**Achado só ao rodar o teste, não um bug do app**: primeiras tentativas de screenshot em tema
escuro (`page.goto` seguido de `page.screenshot` sem esperar nada) capturaram a tela presa em
"Carregando…" — não é o app travando, é o teste tirando o print antes do chunk lazy terminar de
montar depois de um reload completo (`page.goto`, diferente de navegação via `<Link>`). Corrigido
esperando um heading/texto da tela ficar visível antes de cada `page.screenshot`.

**Também achado só no screenshot, não um bug real**: o botão "Continuar" desabilitado no tema
escuro aparece com um degradê estranho no PNG. Inspecionado via `getComputedStyle` — o CSS é
uma cor sólida (`background-color: rgb(242, 242, 244)`, sem `background-image`, opacidade 0.6
uniforme) — é artefato de composição do Chromium headless ao tirar screenshot de um elemento
com `border-radius` + opacidade reduzida, não algo que um usuário real veria no navegador.

Verificado nos dois temas via Playwright (screenshots + suíte permanente rodada de novo: mesmas
8 falhas pré-existentes de antes desta rodada, nenhuma nova).

## Prioridade com 3 níveis (Baixa/Média/Alta)

Fechava um gap documentado antes (só `Normal`/`Alta` no front, protótipo sempre teve os 3).
`Prioridade` (`entities/protocolo/model/types.ts`) virou `'Baixa' | 'Normal' | 'Alta'` — "Normal"
continua sendo o valor gravado (não virou "Media" no dado, ver `dispatch-api/CLAUDE.md`), só o
rótulo mudou: `PRIORIDADE_LABEL` novo em `entities/protocolo/lib/rotulos.ts`
(`{ Alta: 'Alta (urgente)', Normal: 'Média', Baixa: 'Baixa' }`), mesmo padrão de
`ETAPA_LABEL`/`TIPO_PRAZO_LABEL` já existentes ali — centraliza o que antes era uma const local
duplicada dentro de `ProtocoloManualDialog.tsx`.

Mudança pequena e bem contida, confirmada por varredura completa de todo `Prioridade`/
`prioridade` no código antes de mexer: só 4 arquivos precisaram de código novo —
`ProtocoloManualDialog.tsx` (seletor de 3 botões, ordem `['Alta','Normal','Baixa']` igual ao
protótipo, default do formulário de criar mudou de `'Normal'` pra `'Baixa'`, igual
`nvPrioridade` do protótipo), `PainelDetalheProtocolo.tsx` (a metadata do painel colapsava
qualquer coisa que não fosse Alta em "Normal" — trocado pra `PRIORIDADE_LABEL[...]`, senão
`Baixa` ficaria escondida atrás do rótulo errado), e `use-filtro-protocolos.ts` (eixo
"Prioridade" ganhou a 3ª opção, rótulo do meio corrigido de `'normal'` pra `'média'`). O badge
"Alta" nos cards do quadro (`DistribuicaoProtocoloCard.tsx`/`ListaCompletaColunaSheet.tsx`)
**não mudou** — confirmado no protótipo que só `Alta` ganha destaque visual, `Média`/`Baixa`
são só informativas/filtráveis, então a condição `prioridade === 'Alta'` já estava certa.

Verificado via Playwright nos dois temas: modal de criar protocolo mostrando os 3 botões com
"Baixa" pré-selecionado, painel de filtros com as 3 opções e contagem (alta/média/baixa).
Suíte permanente rodada de novo depois — mesmas 8 falhas pré-existentes, nenhuma nova (inclusive
as duas specs que já tocavam prioridade, `distribuicao-v2.spec.ts`/`correcao-reabertura.spec.ts`,
já estavam na lista de falhas conhecidas antes desta mudança, por motivo não relacionado —
conferido a razão exata de cada falha pra não confundir com uma regressão desta rodada).

## Backlog de qualidade de código — auditoria, todos os itens corrigidos

Pedido do dono: revisão de code smell / más práticas / componentes grandes demais no front.
Feita com 2 agentes em paralelo (cluster de Central de Regras + demais widgets/boards) mais
revisão direta dos arquivos construídos nesta sessão, todo achado conferido no código antes de
entrar na lista. Corrigido em 6 fases, cada uma com `tsc -b`/`npm run build`/`verify-visual`
(Playwright, screenshot lido) e a suíte e2e permanente rodada de novo — mesmas 8 falhas
pré-existentes (dado desatualizado no Postgres local, não relacionado) do início ao fim de
todas as fases, nenhuma regressão nova em nenhuma delas.

### [corrigido] Bug real — regra de negócio recriada errada no front

**`AbaAlcadaTestar.tsx`** (simulador "Testar" da aba Alçada, RF-34) mostrava um texto de
destino ("iria para a fila de exceções" / "só {nome}" / "pool aberto") inferido só pela
contagem de elegíveis. A regra real (`MotorDistribuicao.cs`, back) decide primeiro por
`Urgente` (prioridade Alta ou prazo curto), não por contagem — o simulador podia mostrar "só
Fulano" quando o real seria pool (não urgente, 1 elegível), ou "pool aberto" quando o real seria
atribuído a uma pessoa só (urgente, vários elegíveis). Opção escolhida pelo dono: back ganhou
um caso de uso que roda o motor de verdade sobre o caso hipotético (`SimularAlcada.cs`, ver
`dispatch-api/CLAUDE.md`), front ganhou o campo de prioridade que faltava e passou a usar o
destino real da resposta em vez de inferir. Verificado via Playwright: mesmo caso, só trocando
a prioridade, muda de "pool aberto" (Baixa) pra "atribuído a {nome}" (Alta) — prova de que
agora depende da regra real, não de contagem.

### [corrigido] Correção pontual — erro silencioso em Exceções

`ExcecaoCard.tsx` disparava `useAtribuirManualmente`/`useDescartarExcecao` sem tratamento de
erro nenhum — se "Resolver"/"Descartar" falhasse, o clique não fazia nada visível. Ganhou o
mesmo padrão de agregação de erro que `MinhaFilaBoard.tsx` já usava (`atribuir.error ??
descartar.error`, mensagem genérica visível). Verificado forçando um 409 de e-mail duplicado
no fluxo de conferentes (mesmo mecanismo de detecção de erro, ver duplicação abaixo).

### [corrigido] Duplicação de lógica

- **Resolver id→nome duplicado em 4 arquivos** → `criarResolverInfoProtocolo()` novo em
  `entities/protocolo/lib/resolver-info-protocolo.ts` (não é hook — sem `use`, não chama nada
  do React por dentro), usado em `DistribuicaoBoard`/`MinhaFilaBoard`/`FilaDoConferenteBoard`/
  `PainelDetalheProtocolo`.
- **Mesma duplicação no cluster de Central de Regras** → `criarNomesDaCentralDeRegras()` novo em
  `widgets/central-de-regras-board/lib/nomes.ts`, usado em `AbaAlcada`/`AbaAlcadaTestar`/
  `AbaRegrasEmVigor`.
- **`Carregando…` duplicado 7x** → `shared/ui/carregando.tsx` novo (`<Carregando />`, prop
  `className` opcional pra manter o espaçamento que cada chamador já tinha — sem mudar layout
  de ninguém), usado nas 7 abas do cluster mais em `PainelDetalheProtocolo.tsx` (achado extra na
  hora de mexer no arquivo).
- **`GRUPOS` hardcoded 3x** → `entities/tipoAto` passou a exportar `GRUPOS =
Object.keys(GRUPO_LABEL) as GrupoTipoAto[]`, mesmo padrão de `TIPOS_PRAZO` já usado ao lado.
- **Rótulos dessincronizados** → `ExcecaoCard.tsx` e `AbaPorConferente.tsx` passaram a importar
  `ETAPA_LABEL`/`NIVEL_LABEL` de `entities/protocolo`/`entities/conferente` em vez de manter
  cópia local.
- **Boilerplate de diálogo** → extraído só o que era genuinamente idêntico
  (`ehConflito409(error)`, novo em `shared/lib/conflito-409.ts`); reset-ao-abrir e campos do
  formulário continuam próprios de cada diálogo — são formatos diferentes demais (5 campos vs. 2) pra um hook único valer a pena, decisão consciente de não abstrair demais.
- **`ImportarLoteWizard.tsx`** → `paraRequestLinhas()` extraída, usada por
  `handleContinuar`/`handleConfirmar`.
- **`MAX_POOL_VISIVEL`** → `widgets/minha-fila-board/lib/constantes.ts`, reexportado no barrel,
  `FilaDoConferenteBoard` importa de lá em vez de ter cópia própria. **`SEM_EQUIPE`** →
  `widgets/central-de-regras-board/lib/sem-equipe.ts`, com o comentário RF-29a preservado junto
  da definição única.

### [corrigido] Componentes grandes demais / mistura de responsabilidades

- **`AbaAlcada.tsx`** (308 → ~95 linhas) — estado do builder + textos derivados +
  `handleCriarRegra` viraram o hook `useAlcadaBuilder()` (`widgets/central-de-regras-board/
model/use-alcada-builder.ts`); o card do builder virou `<AlcadaBuilderCard />`. `AbaAlcada.tsx`
  ficou só o shell da sub-aba (fetch + as 3 visões).
- **`PainelDetalheProtocolo.tsx`** (331 linhas, maior arquivo do app) — lista de alçada virou
  `<ListaAlcada />`, o bloco de botões de ação condicionais virou `<AcoesDeStatus />` (mutations
  movidas pra dentro do próprio sub-componente, não ficam mais no pai), `avisoExclusao` virou a
  função nomeada `avisoDeExclusao()`. As duas extrações moram no mesmo arquivo (mais simples que
  criar arquivo novo pra cada uma).
- **`RecuperarSenhaPage.tsx`** (268 linhas) — dividida em `PassoIdentificacao.tsx`/
  `PassoCodigo.tsx`/`PassoSenha.tsx`/`PassoOk.tsx` (`pages/recuperar-senha/ui/`), seguindo o
  padrão já usado em `widgets/importar-lote-wizard`. `PassoCodigo` ganhou o timer de 30s como
  estado próprio (não fica mais no shell). As 3 regras de senha viraram `avaliarRegrasSenha()`
  em `pages/recuperar-senha/lib/regras-senha.ts`, reaproveitada pelo shell (pra saber se pode
  avançar) e por `PassoSenha` (pra desenhar o checklist) sem duplicar a regra em dois lugares.
- **`AbaAlcadaMatriz.tsx`** — indicador de cobertura da linha de grupo e da linha de tipo virou
  `<CelulaAlcance estado={...} />` compartilhado (`widgets/central-de-regras-board/ui/
CelulaAlcance.tsx`), com o mapeamento estado→{glifo,cor} em `lib/alcance.ts` (dois `Record`
  separados, `ESTADO_GRUPO`/`ESTADO_TIPO` — são espaços de estado diferentes, cobertura do
  grupo inteiro vs. origem da permissão num tipo, não fazia sentido forçar um union só).

### [corrigido] If/ternário aninhado

- **`RecuperarSenhaPage.tsx`** — o `if` dentro de `if` numa IIFE virou a função nomeada
  `mensagemDeErro()`, fora do componente, com `if`s sequenciais (guard clauses) em vez de
  aninhamento. `pronto`/`botaoLabel` (ternário de 4 ramos) viraram `Record<Passo, boolean>`/
  `Record<Passo, string>`, mesmo padrão que `TEXTOS` já usava no mesmo arquivo.
- **`PainelDetalheProtocolo.tsx`** — `avisoExclusao` (ternário aninhado dentro de template
  string) virou `avisoDeExclusao()`, função com `if`s sequenciais.
- **`AbaAlcadaMatriz.tsx`** — resolvido junto da extração de `<CelulaAlcance />`: cada linha
  agora decide um `status` (uma única variável, um `Record` de lookup) em vez de dois ternários
  paralelos (um pra cor, outro pro glifo) checando a mesma condição duas vezes.

### Verificado e descartado (não é problema)

- Contadores/porcentagens de carga (`ConferenteCard.tsx`, `ConferentesBoard.tsx`,
  `PainelDetalheProtocolo.tsx` "Atribuir ao menos carregado") só exibem `cargaAtual` vindo do
  back ou disparam mutation — nenhuma decisão de atribuição é tomada no front.
- `prazoChip` (`entities/protocolo/lib/prazo-chip.ts`) só traduz o `FaixaSemaforo` que já vem
  pronto do back pra cor/texto — não recalcula limiar nenhum, só o texto de contagem ao vivo
  (que precisa ser client-side por natureza, entre um refetch e outro).
- O limiar de 4h do filtro "urgente" (`entities/protocolo/lib/filtros.ts:23`) é o texto literal
  do RF-18d ("prioridade alta ou menos de 4h pro vencimento"), confirmado contra o protótipo —
  é um conceito diferente do semáforo (que já vem calculado do back) e existe no front porque
  depende do relógio local entre um refetch e outro, não porque reinventa uma regra do back.

## Continuidade de conferência — histórico no painel de detalhe

Pedido do dono (não é RF numerado nem está no protótipo aprovado — ver `dispatch-api/CLAUDE.md`
pra decisão completa, feita antes de codificar): quando um protocolo reprovado reaparece num
relatório seguinte na mesma etapa, o back agora atribui direto ao conferente que fez a primeira
conferência dele. `PainelDetalheProtocolo.tsx` ganhou a seção "HISTÓRICO DE CONFERÊNCIAS" (entre
"LINHA DO TEMPO" e "QUEM PODE CONFERIR ESTE ATO"), só renderizada quando o protocolo tem outras
linhas com o mesmo Número — reaproveita o mesmo padrão visual de `ListaAlcada` (nome do dono à
esquerda, `Chip` de status + data à direita), usando `STATUS_LABEL`/`STATUS_TOM`/
`nomePorConferenteId`/`formatDataHora` já existentes no arquivo. Não precisou de sessão de
protótipo nova — é extensão de uma tela que já existe, não uma página nova.

`entities/protocolo/model/types.ts` ganhou `HistoricoConferencia` (formato cru do back:
`protocoloId`/`andamentoEm`/`status`/`donoId`/`concluidoEm` — front resolve nome/rótulo, mesma
disciplina de sempre) e `DetalheProtocolo.historicoConferencias`. Nenhum endpoint novo — o
campo veio de graça no `GET /protocolos/{id}/detalhe` já existente.

Verificado com Playwright (spec temporário, não faz parte da suíte permanente — não depende de
fixture fixa, igual `painel-detalhe-protocolo.spec.ts` já documenta): importou um protocolo,
reprovou como um conferente de teste, reimportou a mesma linha, confirmou a seção aparecendo
nos dois temas com o dono/status/data certos e "Regra aplicada: padrão aberto" (não uma
`RegraAlcada` — a atribuição veio da continuidade, não de uma regra de alçada).

## Frase completa de alçance em Conferentes — fecha o item do backlog

`ConferenteCard.tsx` mostrava só "pode conferir N tipos de ato" (contagem crua de
`GET /conferentes/alcance`). O protótipo aprovado (`Dispatch.dc.html`, seção do card de
Conferentes) mostra `prefLabel` ("pode conferir todos os M tipos de ato" ou "N de M") **mais**
até 3 pills, uma por `RegraAlcada` aplicável à pessoa (sujeito = ela mesma ou o nível dela,
`fraseRegra`/`r.alvo.join(', ')` no protótipo), com um "+N regras" quando sobra mais — não uma
frase única agregando tudo num string só (motor v2/v3 só aceita um alvo por regra, então "5
tipos numa frase só" no protótipo vem de uma regra com múltiplos itens no alvo, cenário que o
back atual não tem — cada tipo vira uma regra própria aqui, logo N pills, não 1 pill com N
nomes).

- `ConferentesBoard.tsx` passou a buscar `useRegrasAlcada()`/`useTiposAto()`/`useEquipes()` e
  monta, por conferente, a lista de frases via `fraseDaRegra` (já existia, reaproveitado de
  `AbaRegrasEmVigor`/`PainelDetalheProtocolo` — nenhuma lógica de formatação nova).
- `ConferenteCard.tsx` ganhou `prefLabel` (substitui o texto antigo) + até 3 pills + link
  "+N regras" pra Central de Regras.
- `entities/conferente/model/types.ts`: `AlcanceDoConferente` ganhou `equipesPermitidasIds`
  (o record C# já tinha, só não estava espelhado — gap achado na investigação, corrigido de
  passagem).

**Achado no caminho, consequência direta da tabela `config` (ver dispatch-api/CLAUDE.md)**:
`AbaRegrasEmVigor.tsx` (Central de Regras) tinha 2 frases hardcoded na seção "Operação" ("Cada
conferente conduz 1 ato por vez", "Semáforo: amarelo abaixo de 4h, laranja abaixo de 60min") —
agora que esses valores são editáveis via `PUT /config`, texto fixo no front mentiria assim que
alguém editasse. Nova entity `entities/configuracao` (só leitura, `GET /config` — sem tela de
edição própria ainda, mesma decisão do back) substitui os 2 itens por texto derivado de
`useConfiguracao()`.

Verificado com Playwright (spec temporário): Conferentes mostrando `prefLabel`/pills/"+N
regras" nos dois temas (inclusive um caso real de "+1 regra" com 4 regras aplicáveis); Central
de Regras → Regras em vigor mostrando os valores de config corretos na seção Operação.

## `Chip` ganha variante `fonte` — fecha o gap de fidelidade nas pills de equipe/etapa

Gap conhecido do backlog: pills de equipe/etapa (`ProtocoloCard.tsx` em Minha fila,
`ExcecaoCard.tsx` em Exceções) usavam o `Chip` padrão (11px, JetBrains Mono — certo pra
prazo/status), mas o protótipo aprovado usa 10.5px sem mono pra essas duas especificamente.
`shared/ui/chip.tsx` ganhou uma segunda dimensão de variante no `cva`, `fonte?: 'mono' |
'padrao'` (default `'mono'`, preserva os 8 usos existentes de prazo/status/faixa sem tocar
neles — `twMerge` via `cn` resolve o conflito de classes dentro do próprio `chipVariants()`).
`'padrao'` → `font-normal text-[10.5px]`; a pill de equipe (que no protótipo tem peso 500)
ainda passa `className="font-medium"` por cima.

Verificado com Playwright nos dois temas: Minha fila (`ProtocoloCard`, pills "sem equipe"/
"Equipe RIO" + etapa) e Distribuição → Exceções (`ExcecaoCard`, pill de equipe) — tamanho/fonte
batendo com o protótipo, chip de prazo/status ao lado continuando mono/11px sem regressão.

## vitest + lint a sério + hook de pre-commit — fecha o item do backlog

Zero testes de unidade e lint quase desligado eram os dois maiores gaps de ferramental do
projeto (só 2 regras soltas do oxlint ligadas, nenhuma categoria).

**vitest**: `vitest.config.ts` próprio (não misturado em `vite.config.ts` — os dois `UserConfig`
colidem de tipo), ambiente `node` (nenhum dos alvos toca DOM), `exclude: ['e2e/**',
'node_modules/**']` pra não brigar com os specs do Playwright. 5 suítes novas, coladas junto do
arquivo testado (mesmo padrão de colocation do FSD): `shared/lib/format.test.ts`,
`shared/lib/parse-csv.test.ts`, `entities/protocolo/lib/filtros.test.ts`,
`entities/protocolo/lib/prazo-chip.test.ts`, `entities/regraAlcada/lib/frase.test.ts` — 40
testes, cobertura real (não esqueleto) das 5 funções de lógica pura mais expostas a regressão
silenciosa (formatação, parsing de CSV, predicado de filtro, semáforo de prazo, frase de regra).

**Lint, duas rodadas**:

1. Os 8 avisos pré-existentes (6× `set-state-in-effect`, 1× `purity`, 1× `only-export-components`)
   corrigidos por refatoração, nenhum desligado — ver padrão "ajusta o estado durante o render,
   sem efeito" (recomendado pelo próprio react.dev como alternativa a
   `useEffect(() => setState(prop), [prop])`) aplicado em `EquipeCard`, `TipoAtoRow`,
   `FilaConferentesPage`, `datetime-picker.tsx` (`DateTimePicker` e `Stepper`); `buttonVariants`
   extraído pra `button-variants.ts` próprio (resolve `only-export-components` sem perder o
   `cva` original).
2. `.oxlintrc.json` ganhou o bloco `"categories"` (`correctness: "error"`,
   `suspicious`/`pedantic: "warn"`) — isso sozinho surfaceu ~1500 achados. Triado por frequência
   antes de reagir um por um: a maioria (1329 de ~1500) era `react/react-in-jsx-scope`, regra
   que assume o transform clássico do JSX (`import React from 'react'` em todo arquivo) — este
   projeto usa o transform automático do Vite, nunca precisou desse import, então a regra é
   puro falso positivo aqui. Desligada, junto de mais 5 que ou não fazem sentido pra este
   projeto (`no-warning-comments` — a palavra portuguesa "todo" ativa a regra em qualquer
   comentário que a contenha, codebase inteiro é em pt-BR; `require-unicode-regexp` — ruído
   pedante, nenhuma regex do projeto processa texto fora de ASCII de um jeito que dependa
   disso) ou contrariam uma postura já registrada neste CLAUDE.md (`max-lines-per-function`/
   `max-lines` — "se uma combinação de classe repete numa terceira vez vira componente", nunca
   "se a função passa de N linhas"; tamanho por si só não é o sinal usado aqui) ou são estilo
   puro sem valor de correção (`no-inline-comments`). Todas as 6 desligadas com comentário
   justificando em `.oxlintrc.json`, uma por uma — nenhuma desligada só porque dava trabalho.
   Os ~20 achados genuínos restantes foram corrigidos de verdade: `eqeqeq` (2×, `!=` → `!==`,
   seguro porque os campos são `string | null` sem `undefined`), `jsx-no-useless-fragment` (2×,
   `session-boot.tsx`/`require-role.tsx` — `<>{children}</>` vira só `children`, componente
   pode devolver `ReactNode` direto), `no-negated-condition` (`ConferenteCard.tsx`, ternário
   invertido pra tirar a negação do topo), `no-unescaped-entities` (`seletor-unico.tsx`, aspas
   viram `&quot;`), `no-promise-executor-return` (um `e2e` spec, `setTimeout` dentro de chaves
   em vez de corpo implícito da arrow function) e o par `no-shadow`+`no-unstable-nested-components`
   em `calendar.tsx` (arquivo vendorizado do shadcn) — `Root`/`Chevron`/`WeekNumber` (que não
   dependem de nenhuma prop de `Calendar`) hospedados em escopo de módulo em vez de recriados a
   cada render dentro do objeto `components`; só `DayButton` continua definido dentro de
   `Calendar` (depende de `locale`, que vem do closure) — esse ganhou um
   `oxlint-disable-next-line` pontual, comentado, em vez de forçar a extração via
   prop-drilling desproporcional pra um arquivo de terceiro com um único ponto de uso.
   `npm run lint` fecha em 0 erros e 0 avisos.

**Hook de pre-commit**: `husky` + `lint-staged`, `.husky/pre-commit` rodando `npx lint-staged`,
config em `package.json` (`"lint-staged": { "*.{ts,tsx}": "oxlint" }`). Testado de verdade
(stage + `npx lint-staged` direto, sem esperar um commit real): oxlint roda contra os arquivos
staged de fato. Confirmado também que só erro (categoria `correctness`) derruba o exit code —
aviso (`suspicious`/`pedantic`) não bloqueia commit, mesmo comportamento de `npm run lint`
sozinho; decisão consciente de manter (não forçar `--max-warnings 0`), já que a severidade das
categorias em si já foi a decisão deliberada de quais achados merecem parar um commit.

Verificado: `npx tsc -b`, `npm run build`, `npm run test` (40/40) e `npm run lint` (0/0) depois
de cada rodada de correção — inclusive um `verify-visual` pontual em `calendar.tsx`
especificamente (maior risco de regressão silenciosa do lote, por reestruturar como os slots
`Root`/`Chevron`/`WeekNumber`/`DayButton` são registrados no `DayPicker`): `DateTimePicker` em
Importar, nos dois temas, calendário renderizando dias/mês/dia-da-semana corretos.

## `prettier-plugin-tailwindcss` + reformat do repo inteiro — fecha o item do backlog

Último item do backlog de ferramental, deliberadamente por último — rodar antes reformataria
arquivos que as fases anteriores (vitest, lint, `Chip`, frase de alçada) ainda iam editar,
duplicando diff.

`.prettierrc.json`: `semi: false`, `singleQuote: true` (só formaliza o que o código já fazia à
mão, confirmado lendo alguns arquivos antes de fixar as opções — nenhuma mudança de estilo em
si), `printWidth: 120` (`p90` das linhas do projeto, fora dos arquivos vendorizados do shadcn de
`className` gigante, já ficava em ~96 caracteres — 120 é folga suficiente pra não quebrar a
maioria das linhas existentes num diff gigante à toa, sem deixar tão largo que vire ilegível).
`tailwindStylesheet` aponta pro `src/app/styles/index.css` — Tailwind v4 não tem um
`tailwind.config.js` central pro plugin inspecionar sozinho; sem apontar o `@theme`/tokens
customizados (`bg-ok-bg`, `text-text-2`...) o plugin não saberia onde esses nomes entram na
ordem de classe canônica. Confirmado com um teste isolado antes do reformat completo (`bg-card
p-2 flex items-center text-foreground` → `flex items-center bg-card p-2 text-foreground`) — o
plugin está de fato ordenando, não só presente sem efeito.

`npm run format`/`format:check` novos. `lint-staged` (da Fase anterior) ganhou `prettier
--write` antes do `oxlint` na mesma entrada `*.{ts,tsx}` — formata primeiro, lint depois: um
achado de lint não deveria sobreviver só porque a formatação ainda não rodou.

`npx prettier --write .` rodado uma vez no repo inteiro — diff grande (praticamente todo
arquivo `.ts`/`.tsx` mudou alguma coisa: quebra de objeto/parâmetro longo em múltiplas linhas,
vírgula final, ordem de classe Tailwind), mas só formatação — confirmado comparando o bundle de
produção antes/depois (`npm run build`): o chunk principal (`index-*.js`) ficou com **o mesmo
tamanho em bytes gzipados** (86.85 kB nos dois), só o hash do nome do arquivo mudou (conteúdo
do bundle idêntico byte a byte antes de minificar o whitespace, já que source maps não entram
no hash de conteúdo relevante aqui — o ponto é que o tamanho não mudou nem 1 byte, sinal forte
de que nenhuma lógica foi alterada, só formatação de código-fonte).

Verificado: `npx tsc -b`, `npm run build`, `npm run test` (40/40), `npm run lint` (0/0) — todos
limpos depois do reformat completo. **`verify-visual`** em Conferentes e Central de Regras →
Regras em vigor (as duas telas mais recentemente mexidas nesta sessão, maior risco relativo de
uma classe Tailwind reordenada de um jeito que colidisse com outra via `twMerge`), nos dois
temas — nenhuma diferença visual, incluindo os elementos mais sensíveis a essa reordenação
(`prefLabel`+pills de Conferentes, seção "Operação" derivada de `useConfiguracao()`).

## RNF-13 (responsivo abaixo de 760px, app inteiro) + RF-24g (Minha fila em abas) + "N feitos hoje"

Dois itens de backlog fechados juntos. Antes de implementar, verifiquei a fidelidade do próprio
protótipo aprovado nessa faixa de largura (pedido explícito do dono) — abri `Dispatch.dc.html`
via Playwright em 390px e naveguei Login, Dashboard, Distribuição, Minha fila, Conferentes,
Central de Regras (as 5 abas + as 3 sub-abas de Alçada), Importar e o painel de detalhe.
**Achado real no protótipo, não repetido aqui**: em Alçada → Camadas, a tabela "O que cada um
alcança hoje" não tem rolagem própria — o `scrollWidth` do documento inteiro (521px) excede o
`clientWidth` (390px), e simulando o scroll de verdade (`window.scrollTo`) a página inteira
desliza pra lado, arrastando até a barra de navegação fixa junto. A Matriz, do lado, resolve
isso certo com `overflow-x-auto` contido. Implementei com o padrão correto desde o início.

**Mecanismo de breakpoint** (`app/styles/index.css` + `shared/lib/use-is-mobile.ts`, novo):
`--breakpoint-mobile: 760px` dentro do `@theme inline` já existente — Tailwind v4 gera
`mobile:`/`max-mobile:` automaticamente a partir disso (confirmado inspecionando o CSS
compilado: `@media (width>=760px)`/`@media not all and (width>=760px)`), mesmo mecanismo que já
gera `max-sm:`/`max-md:` pros breakpoints padrão. `useIsMobile()` (hook JS, mesmo molde de
`use-now.ts`: `matchMedia` + listener `change` + cleanup) só entra quando a árvore de
componentes ou a quantidade de itens renderizados muda de verdade (troca de estrutura, não só
classe) — os dois lugares comentam um apontando pro outro, já que o número 760 não pode vir de
uma constante JS compartilhada com o CSS.

**`AppShell.tsx`** — abaixo de 760px, a sidebar de 224px vira um header sticky (logo + toggle de
tema + Sair) mais uma `<nav>` sticky com os mesmos itens de navegação como chips roláveis
horizontalmente (`overflow-x-auto whitespace-nowrap`), badge de contagem reaproveitado dentro do
chip. O card de sessão (nome/papel) fica de fora no mobile — confirmado que o próprio protótipo
aprovado também não mostra isso na barra mobile, não é omissão. `LogoutButton` ganhou uma prop
`className` opcional (default cobre o rodapé da sidebar, `w-full text-left`) pra caber compacto
ao lado do toggle de tema na barra mobile.

**RF-24g — Minha fila e Fila do conferente**: `FilaColunas.tsx` (novo,
`widgets/minha-fila-board/ui/`, exportado no barrel e reaproveitado por
`fila-do-conferente-board` do mesmo jeito que `ProtocoloCard`/`EmConferenciaCard` já eram) —
recebe as 3 colunas (Pool/Minhas/Conferência) como children + suas contagens; desktop continua
`flex` lado a lado (comportamento de sempre); mobile vira abas com contador (mesmo padrão visual
de pill-tabs já usado em Central de Regras/Distribuição), só a ativa renderiza. Isso substituiu
a montagem de 3 colunas que estava duplicada em `MinhaFilaBoard.tsx`/`FilaDoConferenteBoard.tsx`.
`MAX_POOL_VISIVEL_MOBILE = 8` (novo em `lib/constantes.ts`) — RF-24g pede 8 no mobile (valor
literal do requisito, não uma proporção do `MAX_POOL_VISIVEL` de desktop, que já diverge do
protótipo por decisão anterior registrada). Alvo de toque 44px nos 4 botões de ação que o
requisito cita por nome (Pegar este/Iniciar conferência/Aprovar/Não aprovar — confirmado
lendo a lógica-fonte do protótipo, `padAcao`/`fonteAcao` só se aplicam a esses 4) via
`max-mobile:h-11 max-mobile:text-[14px]` direto no `<Button>` — os botões secundários de
`ConcluidosHojeList.tsx` (Corrigir/Pedir reabertura/Cancelar pedido) ficam de fora de propósito,
não fazem parte do requisito literal. Confirmado por medição real (`boundingBox().height`):
exatamente 44px.

**RNF-13 no resto do app** — tudo `max-mobile:`/`mobile:` puro (CSS, sem hook JS):
- **Grids de KPI** (4-5 colunas fixas → `max-mobile:grid-cols-2`): Dashboard (as duas visões),
  Conferentes, Central de Regras → Aprendizado.
- **Blocos de 2 colunas**: `AbaPrazos.tsx` (equipes) estava fixo em `grid-cols-2` sem nenhum
  breakpoint, ganhou `max-mobile:grid-cols-1`. Dois blocos já usavam `md:grid-cols-2` (768px, 8px
  de diferença do 760px pedido) — trocados pra `mobile:grid-cols-2`, pra não ter dois cortes de
  largura ligeiramente diferentes coexistindo no mesmo app.
- **Tiras de pills/abas** (Dashboard, Central de Regras — 5 abas, maior risco — Alçada,
  Distribuição): ganharam `overflow-x-auto` no container e `flex-none whitespace-nowrap` em cada
  botão — sem isso os itens de texto longo simplesmente quebravam linha dentro do próprio botão
  (flexbox permite texto encolher/wrap antes de estourar), ficando cramped mas sem overflow real
  de documento; com a mudança, rolam de verdade, como o requisito pede.
- **Tabelas/grades largas**: a tabela shadcn de `VisaoGestao.tsx` (Dashboard) já tinha rolagem
  própria embutida no componente `Table` (`shared/ui/table.tsx` sempre envolve num
  `overflow-x-auto` — achado ao investigar, não precisou de mudança nenhuma). "O que cada um
  alcança hoje" (Central de Regras → Camadas) ganhou `overflow-x-auto` + `min-w-max` nas linhas —
  **exatamente o bug achado no protótipo**, aqui com o padrão certo desde o início.
  `AbaPorStatus.tsx` (Distribuição) era o maior gap real: colunas `min-w-0 flex-1` que espremiam
  em vez de rolar (diferente de `AbaPorConferente.tsx`, que já tinha `overflow-x-auto` certo) —
  `ProtocoloColuna.tsx` (variant "status") ganhou um piso `min-w-[220px]` e o container ganhou
  `overflow-x-auto`, mesmo padrão que "Por conferente" já usava.
- **`DistribuicaoPage.tsx`**: achado no caminho, não estava na lista original — o cabeçalho
  (título + 3 botões: Redistribuir pool/Novo protocolo/Importar relatório) não tinha
  `flex-wrap`, estourando a página inteira em 390px (mesma classe de bug do achado no protótipo).
  Corrigido com `flex-wrap` no container + `max-mobile:w-full` no grupo de botões (sem isso, um
  filho `flex-shrink:0` nunca é convidado a encolher/quebrar linha mesmo dentro de um pai
  `flex-wrap`).
- **`BarraDeFiltros.tsx`**: input de busca (`min-w-[220px]`) ganhou `max-mobile:min-w-0
  max-mobile:basis-full` — empilha em linha própria em vez de forçar overflow ao lado do
  DatePicker/botão Filtros.
- Sheets (`PainelDetalheProtocolo`, `PainelFiltros`) e popovers já usavam `min(Npx, 92vw)` —
  confirmado responsivos por conta própria, nenhum ajuste necessário.

**"N feitos hoje" + tempo de conferência** (item de backlog separado, fechado na mesma rodada) —
back já expõe `ConcluidoEm`/`Duracao`/`ConcluidosHojePorConferente` (ver `dispatch-api/CLAUDE.md`,
mesma seção). `AbaPorConferente.tsx` monta o subtítulo com `Analista {nível} · {N} feitos hoje`
quando o conferente tem pelo menos 1 concluído hoje (map por `conferenteId`, mesmo padrão de
lookup do resto do projeto); `DistribuicaoProtocoloCard.tsx` troca o canto do card concluído
(antes "Aprovado"/"Não aprovado") por `formatDuracaoConcluida(duracao)` (já existia em
`shared/lib/format.ts`, reaproveitado de `ConcluidosHojeList`) — o texto aprovado/reprovado
já vivia na linha de meta/dono (`sufixoConcluido`), não precisou de lugar novo, só parou de
ficar duplicado com o canto.

Verificado nos dois temas via Playwright em 390px, todas as telas tocadas (checando
`document.documentElement.scrollWidth <= clientWidth` em cada uma — mesma medição usada na
auditoria do protótipo) e em 1280px (confirmando zero regressão de desktop): AppShell
(chips rolando, navegação funcionando), Minha fila/Fila do conferente (abas trocando, 8 itens +
"+N protocolos", botão de 44px confirmado por medição), Dashboard, Conferentes, Distribuição (3
abas), Central de Regras (5 abas + Alçada completo). Fluxo real ponta a ponta (não só fake) pro
"N feitos hoje": criar protocolo manual → pegar/iniciar/concluir como conferente de teste →
confirmar "· 1 feitos hoje" no card certo e "324 min"/"0 min" no canto do card concluído. Suíte
e2e permanente rodada de novo depois de todas as fases — mesmas 7 falhas pré-existentes (specs
de verificação visual pontual sem dado re-semeado), nenhuma nova.

## Central de Regras — Alçada: filtro/rolagem em Camadas + "equipe não faz etapa" (Motor v4)

Dois pedidos feitos numa sessão de teste real com um conferente. Item 1 é UI pura, sem mudança
de back: com uma regra por alvo selecionado no construtor (limitação conhecida — o back só
aceita um alvo por regra), selecionar vários tipos de ato de uma vez pra um nível gera dezenas
de regras, e "Base por nível" facilmente passa de 80 cards. `AbaAlcadaCamadas.tsx` ganhou um
campo de busca (filtra por `fraseDaRegra(regra).toLowerCase().includes(busca)`, mesmo padrão
simples já usado em `AbaAlcadaMatriz.tsx`) e cada camada ganhou rolagem própria
(`max-h-[420px] overflow-y-auto`) em vez de esticar a página inteira — mesmo espírito já
corrigido antes em "O que cada um alcança hoje". Contadores dos cabeçalhos continuam refletindo
o total real da camada, não o filtrado.

Item 2 é a extensão do motor (ver `dispatch-api/CLAUDE.md`, "Motor de alçada v4", pro desenho
completo e pro bug real de mapeamento achado no caminho):

- `entities/regraAlcada` — `RegraAlcada`/`CriarRegraAlcadaRequest` ganham `alvoEhEquipeEEtapa`;
  `MotivoAlcada` ganha `'EquipeEEtapa'` (`MOTIVO_ALCADA_LABEL`: "equipe fora da alçada nesta
  etapa"). `fraseDaRegra` ganha um ramo checado **antes** do ramo de etapa simples (a regra
  reaproveita a mesma coluna `alvoEtapa` — sem checar `alvoEhEquipeEEtapa` primeiro, uma regra
  do alvo novo cairia no ramo de etapa antiga por engano): "fazer {etapa} da equipe {nome}" /
  "fazer {etapa} de escreventes sem equipe".
- `widgets/central-de-regras-board/model/use-alcada-builder.ts` — `AlvoTipo` ganha
  `'equipeEtapa'`. `alvoOpcoes` pra esse tipo é o produto cartesiano equipes×2 etapas (+"sem
  equipe"), valor composto (`${equipeId ?? SEM_EQUIPE}::${etapa}`, separador `"::"` — não
  aparece em Guid nem em valor de `Etapa`) — cabe no mecanismo de multi-seleção existente
  (`alvoSelecionados: string[]`) sem mudar o formato do estado do builder. Novo `setAlvoTipo`
  (substitui o `setBuilder` direto que os outros pills ainda usam) trava `permissao: 'Nega'`
  assim que esse alvo é escolhido — mesmo raciocínio da restrição do back (evita o usuário
  bater no 400 sem entender por quê); `AlcadaBuilderCard.tsx` mostra "não pode (fixo pra este
  alvo)" no lugar do seletor de permissão quando esse alvo está ativo, em vez de deixar o
  seletor visível e simplesmente ignorar o valor escolhido.
- `AbaAlcadaCamadas.tsx` — `camadaDe` (réplica local do `ResolvedorAlcada.CamadaDe` do back, só
  pra agrupar a leitura) ganhou `|| regra.alvoEhEquipeEEtapa` na condição de `Camada.Equipe`,
  espelhando o back exatamente (mesmo que o caso de uso real — sujeito nível — já caia em
  `Camada.Nivel` antes disso).

**Bug real achado num teste de comportamento real pela UI, não pelo `tsc`/build/lint nem pelo
`curl` de smoke test do back**: documentado a fundo em `dispatch-api/CLAUDE.md` ("Motor de
alçada v4") — `GET /regras-alcada` devolvia `alvoEtapa`/`alvoEquipeId` nulos pra esse alvo
mesmo com a linha persistida certa no Postgres, porque `ParaResponse` só extraía esses campos
via cast pro tipo antigo (`PorEtapa`/`PorEquipeDeEscrevente`). Só apareceu como
`fraseDaRegra` virando "Nível Júnior não pode fazer undefined de escreventes sem equipe" depois
de criar a regra pela UI de verdade — o preview do builder (que lê o estado JS local, não a
resposta da API) mostrava a frase certa antes de criar, o que por um instante pareceu um bug de
front; comparar a frase pré-criação com a frase pós-refetch foi o que isolou que o problema
era na resposta do back, não no cálculo da frase em si.

**Achado de teste, não de produto**: nome de tipo de ato sai normalizado pelo back (Title Case
por palavra — "E2E" pode virar "E2e"); qualquer teste que crie um tipo via API e depois procure
o pill exato pelo nome original precisa usar busca sem `exact`, não replicar a normalização.

Verificado via Playwright (screenshot temporário, apagado depois — cenário próprio via API:
equipe + conferente Júnior na escala + tipo de ato dedicados, pra não colidir com regras amplas
já existentes no banco local de dev, tipo "Nível Júnior não pode conferir atos de Notariais"):
criar a regra pelo construtor (pill "equipe não faz etapa…", permissão travada, frase certa no
preview), ela aparecer em "Base por nível" com a frase certa, e o simulador "Testar" mostrando
o conferente Júnior barrado com o motivo "equipe fora da alçada nesta etapa" e a trilha
correspondente — nos dois temas. `npx tsc -b`, `npm run build`, `npm run test` (42/42, 2 novos
em `frase.test.ts`) e `npm run lint` limpos. Suíte permanente (`auth`/`session-isolation`/
`cursor`/`login`) verde.

## Seletor de "equipe não faz etapa" redesenhado — dois selects em vez de um cruzado

O dono usou a feature em produção e achou o seletor confuso: era um `SeletorMultiplo` só, com
o produto cartesiano equipe×etapa já cruzado num valor composto (`"Equipe RIO ·
pré-conferência"`, `"Equipe RIO · pós-conferência"`, uma opção por combinação) — pedido dele:
"não era mais fácil ter um [seletor] por equipe lá em cima e aí o select trazer etapa pós e
pré?". Virou exatamente isso: dois `SeletorMultiplo` lado a lado, cada um com seu rótulo
("Equipe"/"Etapa") — o de equipe reaproveita as mesmas opções do alvo "equipe" puro (já
incluindo "sem equipe"), o de etapa é só as 2 opções fixas (pré/pós).

- `useAlcadaBuilder`: `Builder` ganhou `equipeEEtapaEtapas: Etapa[]` (dimensão separada de
  `alvoSelecionados`, que passou a guardar só as equipes pra esse alvo — mesmo formato que já
  usava pro alvo "equipe" puro, sem valor composto). O valor composto com separador `"::"` saiu
  inteiro (não precisa mais — cada dimensão tem seu próprio array agora). `combosEquipeEEtapa`
  (produto cartesiano das duas seleções) é calculado uma vez e reaproveitado tanto pelo preview
  (`alvoTexto`) quanto pela criação de verdade (`handleCriarRegra`) — evita computar a mesma
  combinação duas vezes com lógica potencialmente divergente. `setAlvoTipo` zera as duas
  dimensões ao trocar de alvo (antes só zerava `alvoSelecionados`).
- `AlcadaBuilderCard.tsx`: quando `alvoTipo === 'equipeEtapa'`, renderiza os dois seletores
  lado a lado (`flex flex-wrap items-start gap-3`), cada um com um rótulo pequeno acima
  (`text-[11px] text-text-2`) — para os outros alvos, continua o único seletor de sempre.

Selecionar N equipes × M etapas ainda cria N×M regras (uma por combinação, mesmo padrão de
"uma regra por alvo selecionado" que já vale pros outros alvos — o back continua XOR de um alvo
só por regra).

Verificado via Playwright (screenshot temporário, apagado depois): abrir o construtor, escolher
"equipe não faz etapa…", selecionar "Equipe RIO" no seletor de Equipe e "pré-conferência" no de
Etapa (dois cliques em dois dropdowns distintos, cada um com seu próprio campo de busca), preview
mostrando a frase certa, criar a regra e confirmar via API que persistiu com `alvoEquipeId`/
`alvoEtapa` corretos — nos dois temas. `npx tsc -b`, `npm run build`, `npm run test` (42/42) e
`npm run lint` limpos. Suíte permanente verde.

**Segunda rodada, achado pelo dono usando a tela de verdade**: "Quem" (Por nível/Por pessoa)
continuava trocável com esse alvo selecionado — combinar "Por pessoa" com "equipe não faz
etapa" gera uma frase ambígua ("Aglaé Zuzarte não pode fazer pré-conferência da equipe X" —
de quem é essa equipe, da pessoa ou do escrevente?). A "equipe" do alvo sempre foi a do
**escrevente** cujo ato está sendo conferido, nunca do sujeito da regra — mas nada na tela
deixava isso claro, e o desenho original da feature (ver seção acima, "Novo alvo, não novo
sujeito") sempre foi pensado só pra "por nível" mesmo; permitir "por pessoa" era um buraco
aberto sem querer, não uma capacidade pretendida.

**Fix**: `setAlvoTipo` (mesmo `useAlcadaBuilder`) agora também força `sujeitoTipo: 'nivel'`
junto com `permissao: 'Nega'` ao entrar nesse alvo. `AlcadaBuilderCard.tsx` — a linha "Quem"
troca o toggle "Por nível"/"Por pessoa" por um texto fixo ("Por nível (fixo pra este alvo)"),
mesmo padrão visual já usado pra "Permissão". Sair desse alvo devolve o toggle normal.

Verificado via Playwright (temporário) + inspeção direta de classe CSS (não só screenshot —
pills muito próximos são difíceis de julgar visualmente em baixa resolução, achado ao investigar
uma dúvida do dono que acabou sendo falso alarme): "Por pessoa" escolhido antes → trocar pro
alvo "equipe não faz etapa…" remove os dois toggles e mostra o texto fixo; trocar de volta pra
outro alvo devolve o toggle. `npx tsc -b`, `npm run build`, `npm run test` (42/42) e `npm run
lint` limpos. Suíte permanente verde.

**Terceira rodada, gap real achado pelo dono usando a feature em produção**: ele criou a
primeira regra de verdade ("Quinto Andar não passa por pré-conferência") escolhendo "Nível
Júnior" no "Quem" — e só depois percebeu que a regra criada só bloqueava Júnior; Pleno e Sênior
continuavam conferindo normalmente. O pedido original nunca foi "só o Júnior não pode", sempre
foi "esse ato dessa equipe não passa por essa etapa, ponto, independente de quem". Isso não era
bug de UI — é o design documentado no back (`dispatch-api/CLAUDE.md`, "Motor de alçada v4":
"a distribuidora expressa 'ninguém' criando uma regra Nega por nível") tomando forma exatamente
como decidido, só que a tela não deixava claro que era preciso repetir a criação 3 vezes (uma
por nível) pra ter o efeito completo — e sozinha, ela nunca fazia isso por conta própria.

**Fix**: em vez de exigir 3 cliques manuais, o alvo "equipe não faz etapa" agora cria a negação
pros 3 níveis de uma vez, numa ação só — sem precisar de sujeito universal novo no domínio (a
decisão de não criar isso continua de pé, ver `dispatch-api/CLAUDE.md`). Mudanças em
`useAlcadaBuilder`:

- `handleCriarRegra` (ramo `equipeEtapa`) ignora `sujeitoTipo`/`sujeitoNivel` do builder e cria
  `combosEquipeEEtapa.length × 3` regras (uma por combinação equipe×etapa, vezes os 3 níveis —
  `NIVEIS_PARA_EQUIPE_E_ETAPA`), todas via `Promise.all`.
- `alvoTexto` ganhou frase própria pra esse alvo — "Ninguém confere {etapa} da equipe {nome}"
  (mesmo molde de Reserva em `fraseDaRegra`: "Só X confere Y") — em vez de compor com
  `quemTexto`/`PERMISSAO_LABEL` como os outros alvos fazem.

`AlcadaBuilderCard.tsx`: a seção "Quem" inteira (toggle Por nível/Por pessoa + o seletor de
nível/pessoa embaixo) **desaparece** quando esse alvo está selecionado — não faz sentido
escolher nível pra uma ação que sempre cria pros 3. No lugar, um parágrafo explica: "Essa regra
vale pra qualquer nível — cria a negação pros 3 juntos (Júnior, Pleno, Sênior), sem precisar
escolher quem." A frase de preview no topo do card também troca de composição (`quemTexto +
permissão + alvoTexto`) pra só `alvoTexto` sozinho, já que ele mesmo é a frase completa agora.

**Dado real em produção corrigido junto** (fora do código, direto via API): a regra que o dono
tinha criado só pra Júnior ganhou as duas que faltavam (Pleno, Sênior) pra fechar o efeito
pretendido imediatamente, sem esperar o deploy do fix.

Verificado via Playwright: "Quem" não aparece mais com esse alvo selecionado; criar a regra
("Equipe X" + "pré-conferência") gera exatamente 3 regras (uma por nível, confirmado via API);
preview mostra "Ninguém confere pré-conferência da equipe X" antes mesmo de criar. `npx tsc
-b`, `npm run build`, `npm run test` (42/42) e `npm run lint` limpos. Suíte permanente verde.

## Configuração do sistema (seção 8) — nova aba na Central de Regras

O dono reexportou o protótipo (`Dispatch.dc.html`) com uma aba "Configuração" de verdade
(`abasRegras`, `configVals`/`cfgErros`) — o back já tinha `GET/PUT /config` prontos desde a
sessão anterior, mas sem nenhuma tela (editável só via curl/Swagger, decisão consciente
documentada no `dispatch-api/CLAUDE.md`). Fechado o gap.

- **`entities/configuracao`** ganha `AtualizarConfiguracaoRequest` (mesmo shape de
  `Configuracao` — os 12 campos juntos, sem PATCH parcial). **`features/configuracao/atualizar`**
  (novo) — `PUT /config`, invalida `CONFIGURACAO_QUERY_KEY` no sucesso.
- **`AbaConfiguracao.tsx`** (novo, `widgets/central-de-regras-board/ui/`) — rascunho local até
  "Salvar configuração" (mesmo padrão de outros formulários do projeto que não fazem PATCH
  parcial); erro por campo validado no **cliente primeiro**, espelhando exatamente as regras do
  back (`cfgErros`, incluindo a nova validação cruzada — ver `dispatch-api/CLAUDE.md`, mesma
  seção). O back só devolve UM motivo por vez (`ValorInvalido(string)`), não por campo — por
  isso a validação client-side é a fonte primária da UX de erro; um 400 do back (caso
  inesperado, ex.: corrida entre duas edições) vira aviso geral no topo, não por campo, já que
  não dá pra mapear com segurança um motivo solto pra um campo específico.
- **3 seções, 12 campos**, replicados do protótipo (`configVals`): "Semáforo de prazo"
  (faixaAtencaoMinutos/faixaUrgenteMinutos), "Distribuição e conferência"
  (limiteDeAtosSimultaneos/janelaDeCorrecaoMinutos/tempoMedioPorAtoMinutos), "Aprendizado" (os 7
  limiares do módulo de sugestões). Três tipos de campo, cada um com o controle certo (achado
  comparando com o protótipo real via Playwright, não só o markup — a primeira versão usava um
  único stepper em minutos crus pra tudo, bem menos fiel):
  - **`dur`** (as 3 faixas de tempo) — **dois steppers lado a lado** (horas, minutos), não um
    campo só em minutos — mesma UX do protótipo (`configVals.dur`), bem mais legível pra "4h" ou
    "15min" do que "240". Rótulo formatado à direita via `formatDuracaoCurta` (já existia,
    `shared/lib/format.ts`).
  - **`num`** (casos, dias, atos, min) — um stepper só, com a unidade ao lado.
  - **`pct`** (os 2 limiares em percentual) — **slider nativo (`<input type="range">`) + caixa
    com o número**, igual o protótipo faz (`onRange`) — guarda fração 0–1 no back, edita 0–100
    no campo (mesmo padrão de "front multiplica por 100" do índice de confiança da sugestão).
  - `MiniStepper` (componente local, não compartilhado) generaliza o −/valor/+ pros 3 tipos —
    mesmo padrão visual de `TipoAtoRow`/`DateTimePicker`, mas nenhum dos dois reaproveitado
    direto (ambos específicos demais do próprio contexto — clamp de 2 dígitos, decimais).
- **`AbaRegrasEmVigor.tsx`** — o grupo "Operação" ganhou `onEditar`/`editarLabel`("Editar
  operação"), navegando pra essa aba nova (antes só tinha o texto estático "configuração do
  sistema", sem lugar pra ir).
- **`CentralDeRegrasBoard.tsx`** — 6ª aba, mesma ordem do protótipo reexportado
  (`abasRegras`: vigor/aprendizado/alçada/tipos/prazos/**config**).

Verificado via Playwright, **abrindo o protótipo real (`file://`) lado a lado** (pedido
explícito do dono depois de eu ter feito a primeira versão só pelo markup — o resultado
divergia bastante do real, mesma lição já registrada antes nesta sessão: nunca confiar só na
leitura do `.dc.html`, navegar de verdade): os 3 tipos de campo, os 3 rascunhos/estados
("nada alterado" → sujo → erro → salvo), a validação cruzada rejeitando e aceitando depois da
correção, e o `PUT /config` persistindo de verdade (confirmado lendo o valor de volta via API).
`npx tsc -b`, `npm run build`, `npm run test` (42/42) e `npm run lint` limpos. Suíte permanente
verde.

## Fechando o resto do gap-analysis do protótipo reexportado (RNF-11 + resumo "Operação")

Depois da tela de Configuração acima, dois itens menores que o mesmo gap-analysis tinha achado:

- **Resumo "Operação" de 3 pra 6 itens** (`AbaRegrasEmVigor.tsx`) — adicionados "Correção de
  resultado pelo conferente: 15 min", "Capacidade estimada usa 18 min por ato" e "Aprendizado:
  descarte lembrado por 30 dias", todos derivados do mesmo `useConfiguracao()` que os 3 itens
  originais já usavam — nenhuma chamada nova.
- **RNF-11/RNF-12 (seletor com busca) faltando em dois lugares**: o simulador "Testar" da aba
  Alçada (`AbaAlcadaTestar.tsx`) e a lista de "escreventes sem equipe" em `AbaPrazos.tsx` ainda
  usavam `PillToggle` pra listas que crescem com o cartório (equipes, tipos de ato,
  escreventes) — o padrão estabelecido (`SeletorUnico`) já cobria isso em outros lugares da
  Central de Regras, só não tinha chegado aqui ainda.
  - `AbaAlcadaTestar.tsx`: Equipe e Tipo de ato viraram `SeletorUnico` (`placeholder="buscar
    equipe…"` / `"buscar tipo de ato…"`). Etapa (2 opções) e Prioridade (3 opções) continuam
    `PillToggle` — conjunto pequeno e fixo, mesma exceção documentada pra RNF-11 em outros
    seletores deste projeto. **Prioridade mantida de propósito mesmo o protótipo reexportado
    tendo removido esse campo do simulador** — sem ela o destino calculado (pool/atribuído/
    exceção) não reflete urgência corretamente (RF-34, o motor real decide primeiro por
    `Protocolo.Urgente`), reabriria o bug já corrigido em "Fix: simulador Testar... agora roda
    o motor de verdade" (ver `dispatch-api/CLAUDE.md`, mesma seção) — divergência deliberada do
    protótipo, documentada em comentário no próprio componente.
  - `AbaPrazos.tsx`: "Escreventes sem equipe" virou um `SeletorUnico` de seleção direta (não
    toggle — desmarcar já é coberto pelo botão "Cancelar" existente). Os chips de escrevente
    *dentro* de cada `EquipeCard` continuam pills — lista curta por equipe, não o mesmo caso de
    RNF-11 (que é sobre listas que crescem com o cartório inteiro).

Verificado via Playwright: busca filtrando corretamente em ambos os seletores, popover abrindo/
fechando, seleção persistindo no builder/no destino previsto. `npx tsc --noEmit`, `npm run
build` e `npm run lint` limpos.

## Dois bugs reportados no modal "Novo protocolo": campo de hora de entrada + scroll do Popover

Dois problemas relatados pelo dono usando a tela de verdade.

**1. Faltava campo pra "hora de entrada" na criação manual.** A importação já lê isso do
relatório (`dataHoraAndamento`), mas `ProtocoloManualDialog.tsx` sempre deixava
`CriarProtocoloManual` assumir "agora" como `AndamentoEm` (ver `dispatch-api/CLAUDE.md`, mesma
seção) — sem jeito de registrar um ato que chegou antes do momento em que a distribuidora está
digitando. Campo novo, **só no modo criação** (`!editando` — em edição a referência real é o
`AndamentoEm` original do protocolo, que este modal não toca), reaproveitando o
`DateTimePicker` já existente (`shared/ui/datetime-picker.tsx`, mesmo componente do passo
"Linha de corte" da importação) — sem inventar um seletor novo. Estado local (`andamentoEm:
Date`) resetado pra "agora" toda vez que o modal abre pra criar (mesmo `useEffect` que já
resetava o resto do formulário). A prévia ao vivo (`useSimularProtocoloManual`) só manda
`andamentoEm` no modo criação — em edição continua sem mandar (mesmo comportamento de antes,
"agora" implícito no back), pra não contaminar a prévia de edição com um valor perdido de uma
sessão de criação anterior. Sem campo nenhum no protótipo aprovado pra isso — divergência
deliberada, pedido direto do dono, não fidelidade a nada existente.

**2. Scroll não funcionava na lista de escreventes dentro do modal.** Reproduzido via
Playwright antes de tentar qualquer correção (`page.mouse.wheel` sobre o `PopoverContent` do
`SeletorUnico` — `scrollTop` ficava travado em 0 mesmo com `overflow-y-auto` certo e
`el.scrollTop = 300` funcionando via JS direto). Causa: `ProtocoloManualDialog` é **o único
lugar do projeto** onde um `Popover` (via `SeletorUnico`) fica aninhado dentro de um `Dialog`
(shadcn/Radix) — todo outro uso de `SeletorUnico`/`SeletorMultiplo` está direto numa página, sem
Dialog por cima. Radix `Dialog` trava o scroll da página inteira enquanto aberto (`<body
data-scroll-locked>`), e esse travamento intercepta o wheel de qualquer `Popover` aninhado
mesmo com CSS de overflow correto, porque o conteúdo do Popover é portalizado pra `<body>`,
fora da árvore DOM do Dialog — confirmado isolando cada hipótese via Playwright
(`elementFromPoint` no centro do popover batia certo, `overflow-y` computado era `auto`,
`el.scrollTop` direto funcionava, só o `wheel` de verdade não movia nada).

**Fix, no componente compartilhado** (`shared/ui/popover.tsx`, `PopoverContent`) — não só no
`SeletorUnico`, pra proteger qualquer Popover futuro que caia no mesmo padrão: `onWheel`
manual que só intervém quando `document.body.hasAttribute('data-scroll-locked')` (o travamento
do Radix está de fato ativo), aplicando `scrollTop += deltaY` via JS e suprimindo o
comportamento nativo. Fora de um Dialog (a grande maioria dos usos hoje —
`AbaAlcadaTestar`/`AbaPrazos`/Central de Regras em geral) o guard nunca dispara, scroll nativo
continua exatamente como antes — verificado via Playwright nos dois cenários (dentro do modal:
`data-scroll-locked` presente, `scrollTop` avança 0→300→600 a cada wheel; fora de um Dialog:
sem o atributo, scroll nativo intacto).

`npx tsc --noEmit`, `npm run build` e `npm run lint` limpos. Verificado via Playwright: campo
"Hora de entrada" visível só na criação, com a hora atual pré-preenchida; scroll funcionando de
verdade na lista de escreventes dentro do modal.

## Scrollbar customizada, global

O dono apontou o scrollbar cru do sistema operacional (barra cinza grossa, sem arredondamento)
destoando do resto do design system — visível no scroll horizontal do board de Distribuição
(muitas colunas de conferente lado a lado) mas vale pra qualquer lista/coluna comprida do app.

Regra global em `app/styles/index.css` (`@layer base`, `*` — não um componente por vez):
`scrollbar-width: thin` + `scrollbar-color` (Firefox) e `::-webkit-scrollbar*` (Chrome/Safari),
barra fina (10px), cantos arredondados, com um respiro em volta do polegar via `border:
2px solid transparent` + `background-clip: padding-box`. Cor usa os tokens `--border`
(parado)/`--muted-foreground` (hover) que **já trocam sozinhos com o tema** (`:root`/`.dark`
já os redefinem) — nenhuma regra extra de dark mode precisou entrar aqui.

**Limitação de verificação, registrada com honestidade**: confirmei via `getComputedStyle`
(Playwright) que `scrollbar-width`/`scrollbar-color` resolvem certo nos dois temas (token de
`--border` de cada um), mas a screenshot headless do Chromium não pintou a barra em nenhuma
tentativa (mesmo forçando scroll ativo + hover antes da captura) — mesma classe de limitação já
documentada neste arquivo pra popovers em ambiente headless, não indica problema real no CSS
(a técnica `::-webkit-scrollbar` é o jeito padrão/consolidado de forçar uma barra persistente e
estilizada em vez do overlay nativo do SO, funciona de forma confiável em navegador de verdade).
Não dei como 100% verificado visualmente — vale conferir numa sessão local de verdade antes de
considerar fechado.

## Três bugs reportados: observação travada, falta "data de entrada", DateTimePicker cortado

Três problemas relatados pelo dono usando o app de verdade.

**1. "+Observação" abria e não fechava mais, nem salvando.** `ObservacaoField.tsx`
(`features/protocolo/definir-observacao/ui/`) tinha um único botão que acumulava abrir e
salvar, e o único caminho de fechar era o `onSuccess` do `mutate()` — se a chamada falhasse (ou
nunca resolvesse), o campo ficava aberto pra sempre, sem erro visível e sem nenhum jeito de
voltar atrás. Corrigido com dois botões independentes quando editando ("Cancelar", sempre
funciona, e "Salvar observação", só fecha quando a mutation confirma).

**Causa raiz real, achada testando de verdade (não só lendo código)**: o card do "Pool
disponível" em Minha fila oferecia o botão de observação **antes do conferente pegar o
protocolo** — mas `DefinirObservacao` (back, RF-23) só permite editar quando `protocolo.DonoId
== conferenteRestritoId`, e um protocolo no pool não tem dono nenhum ainda. Todo "Salvar" ali
sempre voltava 403 silencioso, e é exatamente esse card (visto no screenshot do dono) que
travava pra sempre com a versão antiga do componente. Fix: `MinhaFilaBoard.tsx` passa um novo
prop `observacaoSomenteLeitura` pro `ProtocoloCard` da coluna Pool — diferente do
`somenteLeitura` já existente (que também desliga a ação "Pegar este"/"Iniciar conferência"),
esse só trava a edição de observação, mantendo a ação principal do card intacta. Observação já
salva continua visível (só não editável) nesse estado.

**2. Faltava "data de entrada" no card do protocolo.** `ProtocoloResumo` (back) ganhou
`AndamentoEm` (ver `dispatch-api/CLAUDE.md`, mesma seção) — front acompanhou: `andamentoEm:
string` no tipo `ProtocoloResumo` (`entities/protocolo/model/types.ts`), renderizado como
"entrada DD/MM/AAAA, HH:mm" (`formatDataHora`, já existente) logo abaixo da linha do
escrevente, tanto em `ProtocoloCard.tsx` (Minha fila) quanto em `DistribuicaoProtocoloCard.tsx`
(Distribuição) — os dois cards compartilham o mesmo DTO, então o gap era o mesmo nos dois.

**3. `DateTimePicker` (linha de corte da importação) cortava embaixo da tela em janelas
baixas, sem scroll.** O popover (`shared/ui/datetime-picker.tsx`) não tinha limite de altura —
o conteúdo (Data + Calendário + Hora + rodapé de botões) podia ultrapassar a viewport inteira,
e o rodapé ("Início do dia"/"Agora"/"Pronto" — o único jeito de fechar de propósito) ficava
inalcançável. Fix: `PopoverContent` ganhou `max-h-[var(--radix-popover-content-available-height)]`
(variável que o próprio Radix expõe, ninguém no projeto usava ainda) + `overflow-hidden`; Data/
Calendário/Hora foram embrulhados num `<div overflow-y-auto flex-1 min-h-0>`, deixando o rodapé
de botões **fora** da área rolável, sempre visível. Combinado com o flip automático do Radix
(abre pra cima quando não cabe embaixo), o popover inteiro agora sempre cabe na viewport, com
scroll de verdade na parte do meio quando precisa.

**Ajuste consequente em `shared/ui/popover.tsx`**: o fix de scroll-dentro-de-Dialog já existente
(seção "Dois bugs reportados no modal 'Novo protocolo'", acima) assumia que a área rolável era
sempre o próprio `PopoverContent` — deixou de ser verdade com essa mudança no `DateTimePicker`
(agora o scroll é num filho interno). O `onWheel` global passou a subir a partir do alvo real
do wheel até achar o primeiro ancestral que de fato tem conteúdo pra rolar (`scrollHeight >
clientHeight`), em vez de assumir sempre o `PopoverContent` — cobre os dois formatos ao mesmo
tempo, sem quebrar o caso já corrigido antes.

Testado ponta a ponta com Playwright contra a API/Postgres local: criado um conferente de teste
via `POST /conferentes` (removido depois via `DELETE`) pra exercitar o fluxo de verdade — pool
sem botão de observação, "Pegar este" → "Atribuídas a você" com observação editável, abrir/
cancelar (fecha sem salvar)/abrir de novo/salvar (fecha e mostra o texto salvo); "entrada
DD/MM/AAAA" visível nos cards de Minha fila e Distribuição; `DateTimePicker` em viewport de
520px de altura com o botão "Pronto" dentro dos limites da tela e clicável. `npx tsc --noEmit`,
`npm run build`, `npm run test` (42/42) e `npm run lint` limpos.

## Loading unificado — spinner + texto, em vez de linha de texto solta

Pedido do dono ("esse loading tá muito feio"). Levantamento achou **três formatos coexistindo**:
um `<p>Carregando…</p>` copiado à mão em 5 boards de tela inteira (Dashboard, Distribuição,
Minha fila, Conferentes, Fila do conferente — justamente as telas principais), o componente
compartilhado `shared/ui/carregando.tsx` (extraído numa auditoria anterior, usado só nas 7 abas
de Central de Regras + painel de detalhe — os 5 boards nunca foram migrados pra ele) e mais duas
cópias do mesmo texto no gate de sessão (`session-boot.tsx`) e no fallback do `<Suspense>` de
rota (`router.tsx`). Nenhum tinha ícone — só texto cinza, sem peso visual, destoando do
cabeçalho/abas que já renderizavam prontos ao redor (achado real: o "chrome" da tela aparece na
hora, só o corpo virava uma linha perdida).

**Sem referência no protótipo aprovado** (não tem estado de loading nenhum, é uma ferramenta de
design estática) — a forma teve que ser desenhada dentro da linguagem visual já existente, não
copiada de lugar nenhum. Duas direções possíveis (perguntado ao dono): skeleton do layout real
de cada tela (mais polido, mas sem precedente pra seguir, esforço bem maior) vs. spinner
centralizado reaproveitando o `Loader2Icon` já usado no botão "Redistribuir pool"/toast do
Sonner (mais rápido, baixo risco). Escolhido: spinner.

`shared/ui/carregando.tsx` — de `<p>` pra um bloco `flex flex-col items-center justify-center
gap-2 py-14`, ícone `Loader2Icon` (`size-5 animate-spin`) + texto, `className` continua
opcional pra ajuste por chamador. Os 5 boards que tinham o `<p>` copiado à mão passaram a
importar e usar o componente; os `className="mt-5"` que existiam em 4 abas de Central de Regras
(compensação manual de espaçamento pro `<p>` sem padding próprio) foram removidos — o `py-14`
novo já dá o respiro sozinho. `session-boot.tsx` e o `CarregandoPagina` do `router.tsx` também
passaram a usar o componente, cada um dentro de um `flex min-h-screen items-center justify-center
bg-background` (esses dois casos ficam fora do `AppShell`, então precisam centralizar na tela
inteira, não só na área de conteúdo).

**Fora de escopo desta rodada, decisão consciente**: os ~30 botões de ação que já mostram texto
("Salvando…"/"Criando…"/"Processando…") sem ícone continuam como estavam — o pedido era
especificamente sobre o "Carregando…" genérico de carregamento de tela/dado, não sobre todo
estado de pendência de toda mutation do app; virar um padrão à parte, se algum dia fizer sentido.

Verificado via Playwright (delay artificial de ~1.5s interceptando as chamadas à API): board de
Distribuição, Dashboard e uma aba de Central de Regras mostrando o spinner centralizado com bom
respiro, no lugar da linha de texto perdida; conferido nos dois temas (claro/escuro) — cor do
ícone/texto troca sozinha via `text-muted-foreground`, sem regra extra. `npx tsc --noEmit`,
`npm run build`, `npm run test` (42/42) e `npm run lint` limpos.

## Auditoria de listagens sem filtro/paginação — 4 correções

Pedido do dono: revisar todas as listagens do sistema (ênfase na Central de Regras) em busca de
listas compridas sem filtro nem corte que atrapalhassem o uso. Levantamento (agente em
background, cruzando front + back) confirmou que **nenhum endpoint do sistema pagina** (sem
`Take`/`Skip`/cursor em lugar nenhum — só o corte de 30 dias em "concluídos" da Distribuição já
existia) e ranqueou as listagens do pior pro melhor caso. A maioria já estava bem tratada (Alçada
→ Camadas/Matriz/Testar, Distribuição → Por conferente/Por status, Minha fila, Prazos por
equipe, Dashboard — confirmado que os tratamentos de rodadas anteriores continuam no lugar).
Corrigidos os 4 piores, na ordem escolhida pelo dono:

1. **Central de Regras → Regras em vigor, grupo "Alçada"** (`AbaRegrasEmVigor.tsx`) — pior
   caso: ~95+ regras em produção, sem filtro nem corte, **e é a aba padrão** (primeira que
   abre). `GrupoVigor` ganhou `totalSemFiltro?: number` — só o grupo Alçada usa (os outros 3:
   Prazo/Catálogo/Operação são bounded pelo domínio, não precisam de busca). Mesmo padrão já
   usado em Alçada → Camadas: `Input` de busca (filtra por `fraseDaRegra`) + `max-h-[420px]
   overflow-y-auto` só nesse grupo, contador "N de M" quando a busca reduz a lista.
2. **Central de Regras → Aprendizado, "Histórico de aprendizado"** (`AbaAprendizado.tsx`) —
   cresce pra sempre, nunca é limpo (toda decisão aplicar/descartar fica registrada). Mesmo
   padrão: busca por título da sugestão + `max-h-[420px] overflow-y-auto`, contador "N de M",
   mensagem distinta pra "nenhuma decisão ainda" vs. "nenhuma bate com a busca".
3. **Distribuição → Exceções** (`AbaExcecoes.tsx`) — a única lista de protocolo do app sem
   nenhum truncamento próprio (as outras colunas truncam com "+N protocolos" via
   `ProtocoloColuna`). **Achado corrigindo**: cheguei a adicionar uma segunda busca livre nessa
   aba, só que `DistribuicaoBoard.tsx` já passa `excecoes={visaoFiltrada.excecoes}` — a lista
   que chega aqui **já é filtrada** pelo `BarraDeFiltros` do board pai (busca livre, data,
   equipe, tipo, prioridade, prazo). Duas caixas de busca fazendo a mesma coisa seria pior UX,
   não melhor — removido antes de ir pro commit; ficou só `max-h-[560px] overflow-y-auto`
   (sem truncar com "+N": cada exceção exige resolução ativa, esconder atrás de um "ver mais"
   atrapalharia o trabalho, diferente das colunas que só são consulta).
4. **Importar → prévia de linhas** (`PassoLinhas.tsx`) — o "+N linhas" era só texto estático,
   sem nenhum jeito de revisar o resto antes de confirmar a importação (achado real: back já
   documenta que "um lote pode ter centenas de linhas"). Removido o corte fixo em 9
   (`MAX_LINHAS_VISIVEIS`) — agora mostra todas as linhas (filtradas ou não) dentro de
   `max-h-[480px] overflow-y-auto`, com busca (protocolo/tipo/escrevente/equipe) que só aparece
   quando o lote passa de 9 linhas.

Testado localmente via Playwright: busca sem resultado mostrando a mensagem certa em Regras em
vigor; Aprendizado renderizando sem quebrar (histórico vazio no ambiente local, mas o código
segue o mesmo padrão já provado em Camadas); Exceções confirmado com uma **única** caixa de
busca visível na tela (não duas). `npx tsc --noEmit`, `npm run build`, `npm run test` (42/42) e
`npm run lint` limpos.

**Fora de escopo desta rodada, registrado no levantamento mas não corrigido**: Central de Regras
→ Tipos de ato e Conferentes ficaram como "risco moderado/baixo hoje" (dezenas de itens, sem
filtro, mas ainda longe de doer) — não entraram nos "4 piores" que o dono pediu pra priorizar
agora. Nenhum endpoint ganhou paginação de verdade nesta rodada — todas as correções são
mitigação client-side (busca + rolagem contida), igual ao padrão já estabelecido em Camadas;
paginação de back fica pra quando/se o volume justificar (mesmo raciocínio já registrado na
seção de corte de "concluídos" acima).

## Painel de detalhe ganha "Atribuir a…"/"Reatribuir a…" — mandar um ato pra alguém na mão

Pedido do dono: uma opção pra distribuidora mandar um ato manualmente pra um conferente
escolhido. `AtribuirManualmente` (back) deixou de ser exclusivo de exceção — ver
`dispatch-api/CLAUDE.md`, mesma seção — agora também vale pra Pool (ainda sem dono) e Atribuido
(redireciona direto pra outra pessoa, sem devolver ao pool antes).

`AcoesDeStatus` (dentro de `PainelDetalheProtocolo.tsx`) ganhou um botão novo, condicionado a
`status in (Pool, Excecao, Atribuido)` — rótulo muda pra "Reatribuir a…" quando já há dono, só
pra deixar claro que é uma troca, não uma primeira atribuição. Clicar troca o botão por um
seletor inline (`Select` do shadcn + Cancelar/Confirmar) — mesmo padrão já usado em
`ExcecaoCard.tsx` pra resolver exceção, reaproveitado em vez de inventar um segundo jeito de
escolher conferente. Sem restrição de alçada no seletor — mostra todo mundo, igual já era em
`ExcecaoCard.tsx` (decisão consciente, ver back).

**Segunda passada, um dia depois (achado pelo dono comparando com o resto do app)**: o `Select`
puro do shadcn (lista simples, sem busca) destoava do `SeletorUnico` já estabelecido em todo
lugar que escolhe conferente/tipo/equipe (RNF-11 — ex.: os campos de "Novo protocolo"). Trocado
nos dois lugares que usavam esse `Select` pra escolher conferente — aqui e em `ExcecaoCard.tsx`
— por `SeletorUnico`, com `sub: NIVEL_LABEL[c.nivel]` mostrando o nível de cada um (mesmo nível
já exibido em "quem pode conferir este ato", reaproveitado como contexto extra no seletor). O
override de `SelectTrigger` que existia pro RNF-10 (nome não trunca) não foi preservado — o
`SeletorUnico` já trunca por padrão em todo outro uso no app (nenhum dos outros ganhou esse
tratamento especial), então manter um override só aqui deixaria esse seletor inconsistente com
todos os demais — o próprio pedido era exatamente parar de destoar.

**Achado corrigindo, antes de considerar pronto**: `useAtribuirManualmente` só invalidava a
query da visão de Distribuição (`VISAO_DISTRIBUICAO_QUERY_KEY`) — suficiente enquanto o único
uso era `ExcecaoCard.tsx` (a exceção some da lista, o card nem precisa se atualizar sozinho).
Usado agora **de dentro do próprio painel de detalhe**, isso não bastava: depois de confirmar,
o painel continuaria mostrando o dono antigo até fechar e reabrir. Adicionada a invalidação de
`DETALHE_PROTOCOLO_QUERY_KEY(protocoloId)` também, mesmo padrão que `useDevolverAoPool` já
usava — achado por comparar os dois hooks lado a lado, não por bug relatado.

Testado ponta a ponta via Playwright contra a API/Postgres local: protocolo no pool → "Atribuir
a…" → escolhe conferente → confirma → painel atualiza sozinho (status vira "Atribuído", "Dono"
mostra o nome escolhido, linha do tempo ganha o carimbo de "Atribuído", botão agora oferece
"Reatribuir a…") sem precisar fechar/reabrir o painel; confirmado depois que `SeletorUnico`
filtra corretamente (buscar "mar" reduz pra "Marcio Santos"/"Marina Witter", nível como
sub-rótulo) nos dois lugares (painel de detalhe e `ExcecaoCard.tsx`). `npx tsc --noEmit`,
`npm run build`, `npm run test` (42/42) e `npm run lint` limpos.

## "Conferente específico" na criação manual — pula o motor direto na hora de criar

Pedido do dono: em vez de criar o protocolo e ter que reatribuir na mão depois (ver seção
acima), poder já escolher a pessoa na hora de preencher o modal "Novo protocolo". Campo novo,
opcional, só no modo criação (edição já tem seu próprio fluxo de reatribuir no painel de
detalhe) — `SeletorUnico` de conferente (com `sub: NIVEL_LABEL`, mesmo padrão de hoje mais
cedo) + um "Limpar" que só aparece quando algo está escolhido (campo opcional, precisa de
volta fácil pro "deixa o motor decidir").

**Sem endpoint novo nem mudança no back**: reaproveita as duas capacidades que já existem —
`CriarProtocoloManual` sempre roda (nasce em Pool/Atribuído-automático/Exceção, tanto faz) e,
se um conferente foi escolhido, `AtribuirManualmente` roda **depois**, sobrescrevendo o destino
com o `protocoloId` que acabou de voltar da criação. Funciona porque `AtribuirManualmente` já
aceita os 3 status possíveis de saída de `CriarProtocoloManual` (ver seção de hoje mais cedo,
"deixa de ser exclusivo de exceção") — se essa mudança não tivesse sido feita antes, um
protocolo que caísse em Exceção na criação não poderia ser redirecionado assim.

A prévia ("O QUE O SISTEMA VAI FAZER") precisou de um ajuste: a linha "Destino" mostra
"atribuído direto a `<nome>`" em vez do resultado simulado pelo motor quando há um conferente
escolhido — sem isso a prévia mentiria (mostraria o que o motor faria, não o que vai acontecer
de verdade). Equipe/Prazo/Grupo continuam vindo da simulação normal (não mudam com quem vai
ficar dono). `salvando`/`erroAoSalvar` (antes só `mutation.isPending`/`.isError`) agora
combinam as duas mutations em sequência (criar + atribuir), pra o botão/mensagem de erro
refletirem as duas chamadas, não só a primeira.

Testado ponta a ponta via Playwright contra a API/Postgres local: preencheu o formulário,
escolheu tipo de ato/escrevente, escolheu um conferente específico, confirmou a prévia mudando
pra "atribuído direto a Aglaé Zuzarte", criou o protocolo com sucesso. `npx tsc --noEmit`,
`npm run build`, `npm run test` (42/42) e `npm run lint` limpos.

## Uma conta com os dois papéis — distribuidora que também confere

Pedido do dono: a esposa dele, Maria Vittoria, é a distribuidora do cartório mas também confere
atos pessoalmente às vezes — precisa disso na MESMA conta, sem duas contas/login separados. Ver
`dispatch-api/CLAUDE.md`, mesma seção, pro desenho completo do back (decisão de não mexer em
`Usuario.Papel`, zero migration — "também é conferente" é derivado de existir um `Conferente`
vinculado ao `UsuarioId`).

- **`entities/usuario`** — `Usuario.papel: Papel` (valor único) virou `Usuario.papeis: Papel[]`
  (lista) — a mudança de contrato mais ampla desta rodada, tocando todo lugar que lia
  `usuario.papel`. `require-role.tsx` (`RequireRole`) passou de `roles.includes(usuario.papel)`
  pra `usuario.papeis.some((papel) => roles.includes(papel))` — libera a rota se **qualquer**
  papel da pessoa bater com os aceitos por ela. `LoginPage.tsx`/`RegistrarTotpPage.tsx` (redirect
  pra home de papel) usam `usuario.papeis[0]` — a primeira posição é sempre o `Usuario.Papel` de
  verdade (`Distribuidora` ou `Conferente`), nunca o papel derivado, então continua estável pra
  decidir "a home de quem só tem um papel".
- **`AppShell.tsx` — nav mesclada.** `NAV_POR_PAPEL` (o `Record<Papel, Item[]>` de sempre)
  ganhou uma função por cima, `itensNavPara(papeis: Papel[])`: parte da lista de Distribuidora se
  ela tiver esse papel (é a mais completa), senão da lista de Conferente. **Só quando os dois
  papéis coexistem**: o "Minha fila" da Distribuidora (que na verdade aponta pra
  `ROUTES.filaConferentes` — "ver a fila de outro conferente") é renomeado pra **"Fila de
  conferentes"**, e o "Minha fila" de verdade do Conferente (`ROUTES.minhaFila`) é injetado logo
  depois — quem só é Distribuidora continua vendo "Minha fila" exatamente como sempre foi, sem
  nenhuma mudança. `ehDistribuidora` virou `usuario?.papeis.includes('Distribuidora') ?? false`;
  os dois pontos de exibição na sidebar (avatar recolhido `title`, card expandido) usam
  `usuario.papeis.join(' · ')` em vez do papel cru.
- **`DashboardPage.tsx`** — `souGestao` (decide entre a visão completa e a visão restrita) segue
  o mesmo raciocínio do back: `usuario?.papeis.includes('Distribuidora') ?? false` — Distribuidora
  sempre vê a visão de gestão completa, mesmo sendo também Conferente.
- **Vincular conferente a uma conta existente — UI nova.** Botão "Adicionar alçada a uma conta
  existente" na página Conferentes, ao lado de "Novo conferente" (`VincularExistenteDialog.tsx`,
  `widgets/conferentes-board/ui/`) — dialog com e-mail (de uma conta já cadastrada, não cria
  `Usuario` novo), nível e jornada, chamando `POST /conferentes/vincular` (feature nova
  `features/conferente/vincular-existente/`, mesmo molde de `features/conferente/cadastrar/`).
  Trata os dois erros possíveis do back de forma distinta: 404 ("Nenhuma conta com esse
  e-mail") e 409 ("Essa conta já é conferente") — não reaproveita `ehConflito409` sozinho porque
  aqui o 404 também precisa de mensagem própria, diferente de `NovoConferenteDialog`/
  `EditarConferenteDialog` (que só têm um caso de erro esperado, o 409 de e-mail duplicado).

Testado ponta a ponta via Playwright contra a API/Postgres local com a conta combo de teste
(`distribuidora@cartorio.com`, que já tinha um Conferente vinculado do lado do back): sidebar
mostrando "Distribuidora · Conferente", "Fila de conferentes" e "Minha fila" aparecendo como
dois itens distintos de nav (o segundo indo pra `/minha-fila` de verdade, não pro seletor "ver
como outro conferente"), Dashboard mostrando a visão de gestão completa. Nos dois temas.
`npx tsc -b`, `npm run build`, `npm run test` (42/42) e `npm run lint` limpos.

**Bug real em produção, achado pelo dono na hora do deploy — `Uncaught TypeError: Cannot read
properties of undefined (reading 'includes')`.** Sessão persistida no navegador de quem já
estava logado *antes* deste deploy guardava `usuario.papel` (formato antigo, singular) — sem
`usuario.papeis`. `AppShell`/`DashboardPage`/`RequireRole` leem `usuario.papeis.includes(...)`/
`.some(...)` direto; numa sessão assim, isso é ler de `undefined` e quebra a tela inteira antes
até do `GET /auth/me` (que devolveria o formato certo) ter a chance de corrigir a sessão — o
`SessionBoot` só bloqueia a renderização enquanto a query está `isLoading`; no exato instante em
que a resposta chega, o componente já renderiza os filhos (com o `usuario` **ainda não
atualizado**, porque `setSession` só roda no `useEffect` seguinte, depois do commit) antes de
corrigir a store. Deslogar/logar "resolvia" na hora porque o login novo já grava direto no
formato certo — mas ninguém deveria precisar fazer isso manualmente.

**Fix**: `session-store.ts` ganhou `version: 1` + `migrate` no `persist` do Zustand — se a
sessão persistida está na versão anterior (`0`, implícito em qualquer sessão salva antes desta
mudança) e o `usuario` guardado tem `papel` mas não `papeis`, migra pra `{ ..., papeis: [papel]
}` **na hidratação**, antes de qualquer componente renderizar. Resolve o caso raiz (sessão
antiga não quebra mais, sem precisar de logout) — testado via Playwright simulando esse exato
cenário (localStorage com `{ usuario: { papel: 'Distribuidora' }, version: 0 }` + um token real):
o Dashboard carrega normalmente, sidebar já mostra `papeis` corretos, zero erro de página.

**Achado usando a feature de verdade (Vivi testando em produção): dar o papel de Conferente a
uma conta não tem efeito imediato pra quem já está logada.** `GET /minha-fila` respondia 403
mesmo com a sidebar já mostrando "Distribuidora · Conferente" — porque o papel novo só entra
nas *claims do JWT* na próxima emissão de token; `GET /auth/me` atualiza o que a tela sabe sobre
a pessoa (por isso o menu já reagia), mas nunca troca o token guardado. Não é bug, é a natureza
de um JWT (claims fixas desde a emissão até expirar) — mesma classe de coisa que RF-01k já lida
(troca de senha invalida sessões antigas). **Resolução: pedir pra pessoa deslogar e logar de
novo** depois de vincular um Conferente a ela — o login novo emite o token com as duas claims.

**Ajuste de UI, mesma conversa: card de sessão na sidebar virou feio pra quem tem dois
papéis** ("Maria Vittoria" quebrando em 2 linhas ao lado de "Distribuidora · Conferente"
espremido do lado). Pedido do dono: mostrar só o nome. `AppShell.tsx` — o card expandido (rodapé
da sidebar) e o `title` do avatar recolhido deixaram de mostrar `usuario.papeis` — só
`usuario.nome`. Simplificação vale pra todo mundo (não só combo), papel nunca foi essencial ali,
já aparece no resto da tela.

## Tipos de ato — tira o seletor de grupo da lista, ganha busca + rolagem contida

Pedido do dono olhando a lista em produção: "tirar esse negócio de grupo" (o dropdown "sem
grupo"/grupo por linha estava poluindo a tela) e "essa lista merece filtro e paginação".
Confirmado o escopo antes de mexer (`AskUserQuestion`): **só tirar o seletor dessa lista** — o
conceito `GrupoTipoAto` continua existindo pra Matriz de alçada e pro construtor de regra
(alvo "grupo"), sem nenhuma mudança nesses dois.

- **`TipoAtoRow.tsx`** — removido o `Select` de grupo por linha (`useDefinirGrupoTipoAto`,
  `GRUPO_LABEL`/`GRUPOS`, o sentinela `SEM_GRUPO`) inteiro. **Efeito colateral honesto, não
  escondido**: com isso, não sobra **nenhum** lugar na UI pra atribuir grupo a um tipo de ato —
  nem aqui, nem no diálogo de criação (`NovoTipoAtoDialog` nunca teve esse campo). A leitura
  (Matriz, frase de regra por grupo) continua funcionando normalmente pros tipos que já tinham
  grupo definido; só não há mais como definir um novo por enquanto. `features/tipoAto/
  definir-grupo/` fica no repo, sem nenhum consumidor — não removido (é código do back que
  continua existindo e testado; reaproveitável se um lugar pra atribuir grupo voltar a fazer
  sentido, ex.: dentro do próprio diálogo de criar/editar tipo).
- **`AbaTiposDeAto.tsx`**, primeira versão — mesmo padrão já estabelecido em Alçada → Camadas/
  Regras em vigor: `Input` de busca (filtra por nome) + `max-h-[560px] overflow-y-auto`.

**Pivotado pra paginação de verdade na mesma conversa** — o dono, olhando a implementação,
apontou que "busca + rolagem" não é paginação de fato (sem página 1/2/3..., sem `Take`/`Skip`
no back) e pediu a coisa real, especificamente pra esta lista (não pro resto do app, que
continua com o padrão client-side de sempre). **Primeira paginação de verdade do sistema** — ver
`dispatch-api/CLAUDE.md`, mesma seção, pro desenho do back (`ListarTiposAtoComUso` ganha
`busca`/`pagina`/`tamanhoPagina`, devolve `Paginado<T>`).

- **`entities/tipoAto`** — `PaginaDeTipoAtoComUso<T>` (espelha `PaginaDeTipoAtoComUsoResponse`).
  `getTiposAtoComUso`/`useTiposAtoComUso` passam a exigir `{ busca?, pagina?, tamanhoPagina? }` —
  `queryKey` inclui os parâmetros (cada combinação cacheia separada), `placeholderData:
(dadoAnterior) => dadoAnterior` (TanStack Query v5) mantém a página anterior visível enquanto a
  próxima carrega, em vez de piscar um loading a cada troca de página.
- **`shared/lib/use-debounced-value.ts`** (novo, genérico) — busca só dispara request depois de
  300ms sem digitar; filtro client-side do resto do app não precisa disso (já é síncrono, sobre
  um array em memória).
- **`shared/ui/pagination.tsx`** (novo, via `npx shadcn@latest add pagination`) — **gotcha novo
  do `shadcn add` neste projeto**: o arquivo gerado veio com `import { cn } from "cn"` — não
  `@/shared/lib/utils` (o alias real de `"utils"` em `components.json`) — e a CLI ainda
  **instalou um pacote npm de verdade chamado `cn`** (`^0.3.0`) só pra esse import quebrado
  resolver. Import corrigido manualmente pro alias certo; `npm uninstall cn` removeu a
  dependência espúria (mesma categoria do `next-themes` removido antes — nada mais no projeto
  usava). Registrado aqui como mais uma das "armadilhas do shadcn add" já catalogadas nesta
  sessão (desta vez: import quebrado + dependência fantasma, não path de saída errado).
- **`AbaTiposDeAto.tsx`**, versão final — `TAMANHO_PAGINA = 20`; busca (com debounce) reseta
  `pagina` pra 1 sempre que muda; `Pagination`/`PaginationPrevious`/`PaginationNext` do shadcn,
  sem números de página individuais (catálogo ainda pequeno, poucas páginas — não vale a
  cerimônia de `PaginationLink`/`PaginationEllipsis` por enquanto, cresce se precisar).

Verificado via Playwright contra a API local: 24 tipos reais, página 1 com 20 itens, "Página 1
de 2 · 24 tipos"; clicar "próxima" dispara `GET .../com-uso?pagina=2&tamanhoPagina=20` de
verdade (confirmado pela URL da resposta) e troca o conteúdo (primeiro item diferente); voltar
pra página 1 usa cache (sem GET novo, `staleTime` de 30s); busca "venda" reseta pra página 1 e
filtra no back (2 de 24). `npx tsc --noEmit`, `npm run build`, `npm run test` (42/42) e
`npm run lint` limpos.

**Regressão real achada rodando a suíte permanente inteira (não só os 4 specs de sempre)** —
três specs (`conferentes.spec.ts`, `fila-conferentes.spec.ts`, `totp-recuperacao-senha.spec.ts`)
usam a conta seed `distribuidora@cartorio.com` pra clicar em "Conferentes"/"Minha fila" no menu
— como essa conta virou combo (Distribuidora + Conferente) mais cedo nesta sessão, o nav dela
agora mostra "Fila de conferentes" (que contém a substring "Conferentes") e o "Minha fila" real
some, virando um destino diferente do que o teste queria. `conferentes.spec.ts`/
`totp-recuperacao-senha.spec.ts` ganharam `exact: true` no locator de "Conferentes";
`fila-conferentes.spec.ts` passou a clicar "Fila de conferentes" (o rótulo certo agora para essa
conta) em vez de "Minha fila" — o `<h1>` da própria página continua "Minha fila", não mudou,
só o nome do item de menu. **Lição**: uma mudança de rótulo de nav pode quebrar silenciosamente
specs de regressão que nunca tocam o código mudado — só rodar os 4 specs "de sempre" não
detecta isso; vale rodar a suíte inteira depois de qualquer mudança em `AppShell.tsx`/nav.

**Segunda regressão achada rodando `central-de-regras.spec.ts` (não coberta pelos 4 specs "de
sempre")**: o teste de CRUD de Tipos de ato (`esperarLinhaPeloNome`, varre todo `<input>` da
página) parou de achar a linha recém-criada — a lista agora é paginada (20 por página) e o item
de teste (`Tipo Teste <timestamp>`) podia cair na página 2 dependendo de quantos "Tipo
Correcao..." já existiam no banco local antes dele alfabeticamente. Corrigido preenchendo a
busca (`buscar tipo de ato…`) logo depois de criar, isolando o item numa página só do início ao
fim (sobrevive ao rename, já que o nome original continua prefixo do renomeado). **Achado no
caminho, também real**: o primeiro conserto buscava cedo demais, ainda com o diálogo "Novo tipo
de ato" aberto por cima da tela (só fecha no `onSuccess` da mutation, depois do POST resolver) —
o campo de busca de trás não era interativo o bastante nesse instante, e a busca preenchida
nunca chegava a disparar o `GET .../com-uso?busca=...`. Corrigido esperando a resposta do POST
de criação e o diálogo fechar (`expect(page.getByRole('dialog')).toHaveCount(0)`) antes de
mexer na busca.

## Prazos por equipe — mover vários escreventes de uma vez

Pedido do dono: "daria pra selecionar mais de escrevente pra colocar de uma vez em uma equipe?"
— antes só dava pra selecionar um por vez (órfão ou de outra equipe) e mover pra outra.

- **`AbaPrazos.tsx`** — `escreventeSelecionadoId: string | null` virou `selecionadosIds:
string[]`. "Escreventes sem equipe" trocou `SeletorUnico` por `SeletorMultiplo` (já existia,
  usado no construtor de regra — `widgets/central-de-regras-board/ui/SeletorMultiplo.tsx`), com
  o array de selecionados filtrado pra só os que são de fato órfãos (evita o trigger mostrar uma
  contagem que inclui gente selecionada via pill de outra equipe, fora da lista de opções desse
  seletor). `handleMoverParaCa` dispara um `mutateAsync` por escrevente selecionado em paralelo
  (`Promise.all` — não existe endpoint de mover em lote, e não precisa existir só pra isso) e só
  limpa a seleção depois que todos resolverem.
- **`EquipeCard.tsx`** — `escreventeSelecionadoId`/toggle vira `selecionadosIds: string[]`; o
  botão "Mover para cá" aparece se **qualquer** selecionado ainda não é membro dessa equipe
  (cobre o caso de selecionar gente de equipes diferentes e mover todo mundo pra uma equipe só
  num clique). Ganhou `movendo` (estado de pending) pro botão mostrar "Movendo…" e não aceitar
  duplo clique.

Testado ponta a ponta via Playwright contra a API/Postgres local: 2 escreventes órfãos reais
selecionados no `SeletorMultiplo`, banner "2 escreventes selecionados" confirmado, "Mover para
cá" clicado numa equipe (`POST /escreventes/{id}/mover` disparado 2x, confirmado por rede),
`GET /escreventes/sem-equipe` confirmando que os dois saíram da lista de órfãos — dado de teste
revertido no final (mesma convenção de todo teste pontual desta sessão). `npx tsc --noEmit`,
`npm run build`, `npm run test` (42/42) e `npm run lint` limpos.

## `globalSetup` do Playwright — a suíte para de depender de "o que já tinha no banco"

Motivado por um clone de produção pro Postgres local (pedido do dono, pra analisar a Central de
Regras — ver `dispatch-api/CLAUDE.md`, mesma seção, pro `pg_dump`/anonimização): a suíte e2e
inteira parou de rodar, porque quase todo spec loga com contas seed fixas
(`distribuidora@cartorio.com`, `conferente-rf27@cartorio.com`, `conferente-visual@cartorio.com`)
que só existiam porque alguém as criou à mão numa sessão anterior — nenhum código garantia isso.
Comentário do dono, que virou o critério: **"um bom teste não depende de dado local, a não ser
que o dado seja criado pelo teste e depois apagado"**.

Duas categorias de dependência de dado nesta suíte, tratadas diferente:

1. **Identidade de login** (as 3 contas fixas) — quase todo spec precisa disso só pra entrar,
   não é "dado do teste" em si. Resolvido de vez: `playwright.config.ts` ganhou `globalSetup:
   './e2e/global-setup.ts'`, que roda **uma vez**, antes da suíte inteira, chamando `POST
   /dev/seed-e2e` (endpoint dev-only novo, ver `dispatch-api/CLAUDE.md`) — garante as 3 contas
   com senha/estado conhecidos, criando quem não existe e resetando quem já existe. Não importa
   mais o que tinha no banco antes (seed antigo, clone de produção anonimizado, banco vazio
   zerado) — a suíte sempre começa com o mesmo chão de login. Se a API não estiver de pé (ou
   não estiver em Development), `globalSetup` falha com uma mensagem clara em vez de deixar
   cada spec quebrar de um jeito diferente e confuso lá na frente.
2. **Dado específico de cada teste** (protocolo, conferente extra, equipe, regra) — não mudou:
   a maioria dos specs já cria e apaga isso via API dentro do próprio teste (`conferentes.spec.ts`/
   `correcao-reabertura.spec.ts`/`totp-recuperacao-senha.spec.ts` já seguiam essa convenção,
   documentada há tempo na seção "Duas categorias de teste em `e2e/`" abaixo). Isso continua
   sendo responsabilidade de cada spec — `globalSetup` não tenta resolver isso, só a identidade.

**Achado corrigindo, não bug pré-existente do produto**: `session-isolation.spec.ts` tinha um
`getByText('Distribuidora Teste')` sem escopo — contra o clone de produção, a conta seed tem um
ato concluído de verdade (ela é combo, ver "Uma conta com os dois papéis" acima) e aparece
*também* na tabela de desempenho do Dashboard, tornando o locator ambíguo. Escopado pra
`page.getByRole('complementary').getByText(...)` (a sidebar, `<aside>`) — mais robusto a
variação de dado real, não só ao seed antigo que nunca tinha ninguém com ato concluído.

**Fora de escopo desta rodada, por decisão explícita (é o que já estava documentado)**: os
specs de "verificação visual pontual" (`minha-fila`, `distribuicao`, `importar`,
`central-de-regras`, `distribuicao-v2`, `dashboard` visão-conferente, `painel-detalhe-protocolo`,
`alcada-v3`) continuam falhando contra um banco recém-clonado/zerado — isso é esperado, não é o
que este ajuste resolve. Eles dependem de um **cenário** específico (protocolo em tal status,
exceção aberta, tipo desconhecido no catálogo), não só de uma conta pra logar; automatizar isso
também até fica mais barato agora que a suíte não depende de estado ambíguo pra login, mas seria
escopo maior — ver a seção "Duas categorias de teste em `e2e/`", que já registra esse trade-off
("custo > benefício num projeto sem CI ainda").

Testado rodando a suíte inteira (21 specs) contra o clone de produção anonimizado — os 4 specs
de regressão permanente (`auth`/`session-isolation`/`login`/`cursor`) mais 3 que só dependem de
identidade de login, não de cenário (`conferentes`/`fila-conferentes`/`totp-recuperacao-senha`),
passaram limpos; os specs de verificação pontual falharam exatamente como esperado (precisam de
re-seed manual, documentado). `npx tsc --noEmit`, `npm run build`, `npm run test` (42/42) e
`npm run lint` limpos.

## Cadastro manual de escrevente + a pergunta do "Subscritor"

Pedido do dono veio em duas partes. A primeira, cadastro manual de escrevente, tocada nesta
rodada. A segunda — um futuro papel "Subscritor" que, junto com o Escrevente, um dia teria
login próprio pra cuidar da própria etapa no fluxo de vida do protocolo — **investigada, não
implementada**: "Subscritor" não existe em nenhum lugar do documento de requisitos formal (nem
glossário, nem seção de papéis, nem "perguntas em aberto") — só existe como comentário-âncora
em 3 pontos do código deste repo (`entities/usuario/model/types.ts`, `role-home-route.ts`,
`app/routing/require-role.tsx`), antecipando que um papel novo é barato de adicionar (união
discriminada + `Record` indexado + guarda de rota por lista), sem nunca ter sido de fato
definido. Confirmado com o dono: fica pra depois, ele mesmo decide quando prototipar isso no
protótipo/requisitos — mesma disciplina de sempre (a ferramenta de design do dono é quem define
comportamento de domínio novo, não uma suposição no código). Registrado aqui pra não se perder:
se/quando isso avançar, o caminho arquitetural mais próximo já existe neste projeto — o mesmo
padrão que `Conferente` usa (entidade com `UsuarioId` opcional vinculado a um `Usuario`, papel
efetivo derivado como já existe em `PapeisEfetivos`), não um mecanismo novo. `Escrevente` hoje é
puro dado de entrada (`Id`/`Nome`/`EquipeId`, sem `UsuarioId` nenhum) — precisaria desse mesmo
salto se um dia ganhar login.

- **Cadastro manual de escrevente** — até aqui só nascia como efeito colateral de importar um
  lote ou de criar/editar um protocolo manual com nome novo. `NovoEscreventeDialog.tsx` (novo,
  `widgets/central-de-regras-board/ui/`), mesmo padrão visual de `NovoTipoAtoDialog` — nome +
  `SeletorUnico` de equipe (opcional, com opção "Sem equipe" explícita). Feature nova
  `features/escrevente/criar/` (`POST /escreventes`, ver `dispatch-api/CLAUDE.md` mesma seção).
  Botão na aba "Prazos por equipe" (`AbaPrazos.tsx`), ao lado de "Nova equipe" — é a aba onde
  escreventes já são geridos (mover entre equipes, ver órfãos).

Testado ponta a ponta via Playwright contra a API/Postgres local: criar sem equipe, confirmar
que aparece no seletor de "escreventes sem equipe" da própria aba, criar duplicado (mensagem
"já existe um escrevente com esse nome"). `npx tsc --noEmit`, `npm run build`, `npm run test`
(42/42) e `npm run lint` limpos.

## Tooltip no chip de prazo — "prazo restante para a conferência deste ato"

Pedido do dono: explicar, no hover, o que o chip de prazo ("vence em 3h"/"estourou há 20min")
significa — primeira vez que este app usa tooltip de verdade (até aqui só `title` nativo do
browser, aceito como limitação em RNF-10/truncamento de nome).

- **`shared/ui/tooltip.tsx`** (novo, via `npx shadcn@latest add tooltip`) — **mesmo par de
  gotchas já catalogado nesta sessão pro `pagination.tsx`**: import quebrado (`from "cn"` em vez
  de `@/shared/lib/utils`) corrigido manualmente, e a CLI instalou de novo o pacote npm fantasma
  `cn` (`npm uninstall cn` removeu). O import de `radix-ui` (pacote unificado, não
  `@radix-ui/react-tooltip`) **não é gotcha, é o padrão já usado por todos os outros
  componentes Radix deste projeto** (`dialog`/`popover`/`select`/`sheet`/`alert-dialog`/
  `progress`/`label`/`button` — confirmado antes de mexer, pra não "corrigir" algo que já
  estava certo).
- **`TooltipProvider`** montado uma vez em `app/providers/app-providers.tsx` (mesmo nível do
  `Toaster`) — `delayDuration={300}` em vez do `0` que o shadcn usa por padrão: é explicação de
  dado (RF-14), não menu que precisa abrir instantâneo; 300ms evita abrir à toa em qualquer
  passada de mouse.
- **`entities/protocolo/ui/PrazoTooltip.tsx`** (novo — primeiro componente em `ui/` desta
  entidade, que até aqui só tinha `model/lib/api`) — wrapper fino (`children` + texto fixo),
  não um componente de prazo próprio: cada tela decide o que renderizar dentro (`Chip` na
  maioria dos casos, `<span>` colorido sem pill na aba "Por status" de Distribuição, que já
  tinha uma variante visual diferente pro mesmo dado) — o wrapper só acrescenta a explicação,
  sem duplicar lógica de chip em 5 lugares.
- Aplicado nos 5 lugares que mostram o chip de prazo como **contagem regressiva ao vivo**:
  `ProtocoloCard`/`EmConferenciaCard` (Minha fila), `DistribuicaoProtocoloCard` (as duas
  variantes, "conferente" e "status"), `ListaCompletaColunaSheet`, `PainelDetalheProtocolo`.
  **Deliberadamente fora**: `PassoLinhas.tsx` (prévia de importação) — mostra o *tipo* de prazo
  ("D+1"/"1 hora"), não uma contagem regressiva de um protocolo que ainda nem existe; "prazo
  restante para a conferência" não faz sentido semântico ali.

Testado via Playwright contra a API local, hover de verdade (não só leitura de classe CSS): o
texto do tooltip aparece depois do hover tanto em Minha fila (`conferente-rf27@cartorio.com`)
quanto em Distribuição (`distribuidora@cartorio.com`, contexto de browser separado pra sessão
não vazar). `npx tsc --noEmit`, `npm run build`, `npm run test` (42/42) e `npm run lint`
limpos.

## Badge "Alta" também nos cards de Minha fila — gap real, não regressão

Dono relatou "a tag de prioridade não está aparecendo na fila dos conferentes". Investigado
antes de mexer: não era bug — o badge de prioridade Alta nunca tinha sido implementado nos
cards de Minha fila, só em Distribuição (`DistribuicaoProtocoloCard.tsx`). Conferido no
protótipo aprovado (`Dispatch.dc.html`): a tag `p.alta` só aparece na seção de Distribuição; o
bloco `isFila` (Minha fila) nunca desenha esse indicador — RF-24f cita prioridade só como eixo
de filtro, nunca como badge no card. Confirmado com o dono antes de implementar (diverge do
protótipo de propósito, mesmo padrão de outras divergências documentadas já registradas aqui).

`ProtocoloCard.tsx`/`EmConferenciaCard.tsx` (`widgets/minha-fila-board`) ganharam o mesmo badge
(`10.5px`, `font-semibold`, `border-bad-border`/`bg-bad-bg`/`text-bad-fg`, `rounded-full`) já
usado em Distribuição — `ProtocoloCard` na linha de equipe/etapa, `EmConferenciaCard` na linha
da etapa (não tinha `info`/tipo de ato nesse card, só etapa). `ListaCompletaPoolSheet.tsx`
ganhou de graça, por reaproveitar `ProtocoloCard` — nenhuma mudança própria precisou.

Verificado via Playwright contra a API/Postgres local: protocolo manual criado com
`prioridade: "Alta"` via `POST /protocolos/manual`, atribuído a um conferente de teste via
`POST /protocolos/{id}/atribuir`, badge "Alta" visível no card "Atribuídas a você" nos dois
temas — protocolo removido depois. `npx tsc -b`, `npm run build` e `npm run lint` limpos.

## "Novo protocolo" com Número já existente — mensagem de erro passa a orientar

Dono relatou: tentou cadastrar manualmente o protocolo 263605 (já Aprovado, precisando de uma
nova conferência porque algo mudou) e travou com "este protocolo já existe no sistema" — beco
sem saída, sem dizer o que fazer. Cheguei a alterar `ResolvedorDeContinuidade.PodeRecriar`
(back) pra liberar recriação de um Número Aprovado, mas revertido depois de conversar com o
dono sobre os cenários reais — concluímos que **não era bug**: os dois caminhos certos pra esse
cenário já existem hoje, sem precisar de nenhuma mudança de código. (1) se o mesmo Número
reaparece numa reimportação de relatório,
a continuidade já assume de novo pro mesmo conferente, sem bloqueio nenhum (`ImportarLote` nunca
checou "já existe"); (2) se é a distribuidora decidindo na hora, sem esperar reimportação, o
caminho é abrir o protocolo já existente e clicar **"Reabrir conferência"** — reaproveita o
mesmo registro, com todo o histórico (`TempoAcumuladoAnterior`/`ReabertoEm`), em vez de criar um
segundo registro ligado só pelo Número. "Novo protocolo" (`CriarProtocoloManual`, RF-18f) é pra
ato que chega de fora do relatório, nunca visto antes — não é a ferramenta certa pra reabrir
algo que já existe.

**Fix, só de UX**: as duas mensagens de "já existe" em `ProtocoloManualDialog.tsx` (a validação
ao vivo enquanto digita o Número, e a que aparece depois de um 409 de verdade no submit)
passaram a orientar pra ação certa — "abra-o e use 'Reabrir conferência' em vez de cadastrar de
novo" — ao invés de só travar sem explicar o que fazer. Nenhuma mudança de contrato de API ou de
lógica de negócio: o back continua exatamente como estava (nenhum fix foi necessário lá).

`npx tsc -b`, `npm run build` e `npm run lint` limpos.

## Pausar conferência — "a pessoa sai pra almoçar, por exemplo"

Pedido do dono, não é RF/protótipo (ver `dispatch-api/CLAUDE.md`, mesma seção, pro desenho
completo do back). `ProtocoloResumo` (`entities/protocolo`) ganha `pausadoEm: string | null`.
Duas features novas, mesmo molde de `iniciar-conferencia`: `features/minha-fila/
pausar-conferencia`/`retomar-conferencia` (`POST /minha-fila/{id}/pausar`\|`/retomar`).

`EmConferenciaCard.tsx` (`widgets/minha-fila-board`) — quando `pausadoEm` está presente: o
cronômetro no topo do card vira o texto "Pausado", e o botão "Retomar" (com `PlayIcon`,
`lucide-react`) substitui a linha Aprovar/Não aprovar inteira — reforça no front a mesma regra
que o back já impõe (`ConcluirConferencia.EstaPausado`): não dá pra concluir sem retomar
primeiro. Quando não está pausado: um botão pequeno de ícone (`PauseIcon`) aparece ao lado do
cronômetro, mesmo padrão visual dos ícones de stepper já usados em `ConferenteCard.tsx`
(`MinusIcon`/`PlusIcon`) — não um `Button` de texto cheio, porque é uma ação secundária que não
merece o mesmo peso visual de Aprovar/Não aprovar. `FilaDoConferenteBoard.tsx` (Distribuidora
vendo a fila de outra pessoa, `somenteLeitura`) já não passa `onPausar`/`onRetomar` — o card
mostra "Pausado" quando for o caso, mas sem nenhum botão de ação, mesmo padrão dos outros já
existentes.

Verificado via Playwright contra a API/Postgres local, login real como conferente: card antes
da pausa (cronômetro + ícone de pausar visível), depois de pausar ("Pausado" + "Retomar",
Aprovar/Não aprovar ausentes — `toHaveCount(0)`), nos dois temas; retomado de novo, confirmado
que Aprovar/Não aprovar voltam. `npx tsc -b`, `npm run build`, `npm run test` (42/42) e
`npm run lint` limpos.

**Visibilidade das pausas** (pergunta do dono, mesma conversa: "como garantir que ninguém abusa
da pausa pra melhorar o tempo dela?" — ver `dispatch-api/CLAUDE.md`, mesma seção, pro desenho do
back). `DetalheProtocolo` (`entities/protocolo`) ganha `pausadoEm: string | null` e
`pausas: PausaConferencia[]` (`pausadoEm`/`retomadoEm`/`duracao`, tipo novo exportado no barrel).

`PainelDetalheProtocolo.tsx` — "LINHA DO TEMPO" ganha a entrada "Pausado" (mesmo padrão de
`Reaberto`/`Corrigido`); seção nova "PAUSAS" (só renderizada quando `pausas.length > 0`, mesmo
padrão condicional de "HISTÓRICO DE CONFERÊNCIAS") com um componente `HistoricoDePausas` — linha
de resumo ("N pausas · Xmin no total", via `formatDuracaoCurta` somando os intervalos em ms) mais
um card por pausa (`pausadoEm → retomadoEm`, duração via `formatDuracaoConcluida`), mesmo padrão
visual de `HistoricoConferencias` (lista de cards, já existente no mesmo arquivo).

Verificado via Playwright contra a API/Postgres local: protocolo pausado e retomado duas vezes,
painel de detalhe aberto como distribuidora mostrando "2 pausas · Xmin no total" mais os dois
cards com os intervalos certos (conferido via `innerText` do conteúdo do Sheet, não só
screenshot — o Sheet tem rolagem própria, um `fullPage` screenshot sozinho não capturava o
conteúdo abaixo da dobra). `npx tsc -b`, `npm run build`, `npm run test` (42/42) e `npm run lint`
limpos.

## Ajustar duração — a distribuidora corrige o tempo final de conferência

Pedido do dono ("como distribuidora e admin do sistema, editar o tempo de conferência de um
protocolo") — ver `dispatch-api/CLAUDE.md`, mesma seção, pro desenho do back (`AjusteDeDuracao`,
histórico auditável, reflete no Dashboard/RF-46).

`entities/protocolo`: `DetalheProtocolo.duracao`/`.ajustesDeDuracao` (tipo `AjusteDeDuracao`).
**Exceção ao padrão "back manda o fato cru, front resolve o nome"**: `AjustadoPorId` é sempre
uma Distribuidora, não necessariamente alguém na lista de Conferentes que o front já carrega —
sem `GET /usuarios` geral, o back resolve o nome e manda pronto (`ajustadoPorNome: string`), não
o Guid cru. `features/protocolo/ajustar-duracao` (`POST /protocolos/{id}/ajustar-duracao`,
`{ protocoloId, duracaoMinutos, motivo }`, invalida a query de detalhe + `['dashboard']` inteiro
por prefixo — a mutation não sabe qual aba do Dashboard está aberta).

`PainelDetalheProtocolo.tsx`:
- Linha "Duração" nos metadados do topo (`linhas`), já existia — só passou a ficar visível de
  verdade agora que há uma ação pra editá-la.
- Seção "AJUSTES DE DURAÇÃO" (`HistoricoDeAjustesDeDuracao`, só renderizada quando há pelo menos
  um ajuste) — mesmo padrão visual de `HistoricoDePausas`: resumo ("N ajustes") + um card por
  ajuste (nome de quem ajustou + data, `duracaoAnterior → duracaoNova`, motivo se houver).
- `AcoesDeStatus` ganha "Editar tempo de conferência" (visível só quando `status` é
  `Aprovado`/`Reprovado` — mesma guarda do caso de uso no back), mesmo padrão de toggle inline
  já usado por "Atribuir a…": clique abre um campo de minutos (`Input type="number"`,
  pré-preenchido via `parseDuracaoParaMinutos(detalhe.duracao)`) + campo de motivo opcional +
  Cancelar/Confirmar.

Verificado via Playwright contra a API/Postgres local (spec temporário, apagado depois): criado
protocolo, atribuído, concluído (~2s de duração real) como conferente de teste; como
distribuidora, "Editar tempo de conferência" → 45min + motivo → `POST .../ajustar-duracao`
confirmado por resposta de rede (204); seção "AJUSTES DE DURAÇÃO" aparece com "Distribuidora
Teste · {data}", "0 min → 45 min" e o motivo, nos dois temas; `GET /dashboard` confirmado (via
API, não só UI) com `tempoMedio: "00:45:00"` pro conferente — reflete no Dashboard como pedido.
`npx tsc -b`, `npm run build`, `npm run test` (42/42) e `npm run lint` limpos. Regressão
permanente (`auth`/`session-isolation`/`login`/`cursor`) verde.

## Painel de detalhe — bloco "Histórico" recolhível

Pedido do dono, mesma conversa do item acima: "esse painel já tá ficando grande demais não?" —
cada seção de auditoria (Histórico de conferências, Pausas, Ajustes de duração) fazia sentido
isolada quando entrou, mas a soma virou muita coisa empilhada num painel de 432px de largura.

`shared/ui/collapsible.tsx` (novo, via `npx shadcn add collapsible` — sem gotcha desta vez, não
usa `cn`, nenhuma dependência espúria instalada). `PainelDetalheProtocolo.tsx` ganha
`BlocoHistorico` — agrupa as 3 seções condicionais num único `Collapsible`, **fechado por
padrão** (`useState(false)`), com o gatilho mostrando só "HISTÓRICO · N" (soma das 3 contagens)
e um `ChevronDownIcon` que gira 180° quando aberto. O bloco inteiro não renderiza nada quando as
3 seções estão vazias (mesmo critério que cada uma já usava sozinha). Cada subseção manteve seu
próprio título ("CONFERÊNCIAS ANTERIORES"/"PAUSAS"/"AJUSTES DE DURAÇÃO") dentro do conteúdo
expandido — só o agrupamento e o toggle são novos, nenhuma lógica de cada subseção mudou.

Verificado via Playwright contra a API/Postgres local (spec temporário, apagado depois): criado
um protocolo, reaberto, pausado/retomado e com a duração ajustada (gera 1 pausa + 1 ajuste —
reabrir a mesma linha não gera `HistoricoConferencia`, isso é só pra outras linhas com o mesmo
Número via continuidade/reimportação); confirmado "HISTÓRICO · 2" fechado por padrão (subseções
não visíveis), clique expande mostrando as duas, nos dois temas. `npx tsc -b`, `npm run build` e
`npm run lint` limpos.

## Estratégia de testes — cobertura com ratchet + primeiros testes de componente (RTL)

Pedido do dono: "não temos nada de teste unitário no front e sinto falta de um coverage no
backend". O levantamento matizou a primeira metade: vitest já existia com 5 suítes (~42 testes),
mas **só de função pura** — ambiente `node`, sem DOM, nenhum componente ou hook exercitado — e
**nenhuma medição de cobertura** (`@vitest/coverage-v8` nem estava instalado). Convenções
adotadas do repo vizinho `swap/frontend/swap-benefits-web` (skills `testing-strategy`/`gate`,
`docs/patterns/testing-strategy.md`, ADR-0002/0005), que o dono apontou como já validadas por
ele em projeto real — adaptadas, não copiadas: lá o registro de decisão são ADRs em `docs/`,
aqui é este arquivo, e lá existe uma regra de "E2E obrigatório pra operação financeira" que não
tem equivalente neste domínio.

### A adaptação que mais importa: aqui a regra de negócio não mora no front

O critério nº 1 de priorização do swap é "decide elegibilidade/valor/compliance → teste unitário
primeiro". Neste projeto isso **cai pro back**: motor de distribuição, alçada, prazo e score do
Dashboard vivem no `dispatch-api` por decisão de arquitetura ("o front só chama endpoint e
renderiza"). Então a ordem efetiva aqui é: lógica pura → **regressão de bug que já aconteceu** →
estado de hook → componente com condicional. Está registrado assim na skill `testing-strategy`
nova, com o contra-exemplo real do projeto (o simulador "Testar" que inferia destino por
contagem em vez de usar a regra do motor).

### Cobertura com ratchet

- `@vitest/coverage-v8`, `reporter: ['text', 'html']`, `include: ['src/**/*.{ts,tsx}']` — o
  `include` importa: sem ele o v8 só reporta arquivo que algum teste carregou, escondendo
  justamente o que ninguém testa.
- `exclude` mínimo, cada item com motivo no próprio arquivo (regra do swap: exclusão é
  "estruturalmente 0% pra sempre", nunca "falta testar") — `*.d.ts`, os próprios testes,
  `main.tsx` (só monta o root) e o helper de teste. **Os primitivos vendorizados do shadcn
  ficam no denominador de propósito**: neste projeto eles são editados à mão (`progress.tsx`
  teve fix de bug, `calendar.tsx` foi reestruturado, `popover.tsx` ganhou fix de scroll), então
  não são "gerado, nunca editado".
- `thresholds.autoUpdate: true` — a primeira run reescreveu o piso pro real: **lines 7,53% ·
  functions 5,32% · branches 4,99% · statements 7,86%**. Número baixo e honesto, mesmo ponto de
  partida do swap (~0,7%). Daqui pra frente só sobe; esse diff do `vitest.config.ts` é commitado
  junto com os testes que o ganharam, nunca abaixado na mão.
- **Confirmado que o ratchet tem dente, não é só configuração**: rodando com
  `--coverage.thresholds.lines=50`, o vitest sai com **exit 1** e a mensagem
  "Coverage for lines (7.53%) does not meet global threshold (50%)" — então `npm run check`
  falha de verdade se a cobertura regredir.
- Scripts novos: `test:coverage` e `check` (`tsc -b && oxlint && vitest run --coverage`, o tier 1
  da skill `gate` nova).

### RTL entrando pela primeira vez

`@testing-library/react` + `/dom` + `/jest-dom` + `/user-event` + `jsdom`. `vitest.config.ts`
passou a `environment: 'jsdom'` global (as suítes puras rodam igual nele — mais simples que
pragma por arquivo), ganhou `plugins: [react()]` (JSX nos `*.test.tsx`) e `setupFiles`.

- **`vitest.setup.ts`** — `afterEach(cleanup)` (o Vitest não dá o `afterEach` global que o Jest
  dá de graça pra RTL; sem isso um render vaza pro teste seguinte e as queries passam a achar
  dois elementos) e **polyfill de `window.matchMedia`**. O polyfill aqui **não é opcional** como
  no swap: `shared/lib/theme-store.ts` chama `matchMedia('(prefers-color-scheme: dark)')` na
  própria inicialização da store (no import, não em efeito) e `use-is-mobile.ts` também usa —
  qualquer teste que importe `AppShell` ou a store de tema explodiria sem ele.
- **`shared/lib/test/render-with-providers.tsx`** — `QueryClient` novo por teste (`retry: false`;
  o `queryClient` de `shared/lib/query-client.ts` é o singleton do app e vazaria cache entre
  casos) + `MemoryRouter` (componente com `<Link>`/`useNavigate` quebra fora de um Router — o
  `LoginForm` tem dois).

### Primeira leva: 4 suítes (42 → 60 testes)

1. **`shared/ui/progress.test.tsx`** — regressão do bug já documentado: o componente gerado pelo
   `shadcn add` não repassava `value` pro `ProgressPrimitive.Root`, a Root ficava
   `data-state="indeterminate"` e a barra renderizava invisível, sem erro no console. Agora
   travado por asserção de `data-state`/`aria-valuenow`/`transform`.
2. **`shared/ui/surface-card.test.tsx`** — o `compoundVariants` (`destaque` sempre vence `tom`),
   regra deliberada e não óbvia lendo o JSX. *(`Chip` ficou de fora: apresentacional puro, sem
   condicional — pela política, não prioriza teste.)*
3. **`widgets/filtro-protocolos/model/use-filtro-protocolos.test.ts`** — `renderHook`. A função
   pura embaixo já tinha suíte; o que nunca fora exercitado é a fiação de estado: alternar liga e
   desliga, "sem equipe" como valor legítimo (não ausência de filtro), eixos combinando com E,
   contagem contra o conjunto completo (RF-18e), `texto`/`data` fora do badge, `limpar`.
4. **`features/auth/login/ui/LoginForm.test.tsx`** — caminho mais crítico do app. Mocka **só**
   `api/login` (`vi.mock`), mantendo `LoginForm → useLogin → login()` real. **Sem MSW** (não
   instalado): entra se/quando vários testes precisarem de mock de rede consistente.

### Dois gotchas novos, achados rodando

- **TanStack Query v5 passa um 2º argumento pra toda `mutationFn`** (`{ client, meta,
  mutationKey }`). Um `expect(mock).toHaveBeenCalledWith({ email, senha })` falha por causa dele
  mesmo com o payload certo — a asserção tem que olhar `mock.calls[0][0]`.
- **Os matchers do jest-dom passavam em runtime e quebravam o `tsc -b`.** O `vitest.setup.ts`
  fica fora do `include: ["src"]` do `tsconfig.app.json`, então a augmentação
  `declare module 'vitest'` nunca entrava no programa de tipos. Resolvido com
  `src/vitest-env.d.ts` (um `import '@testing-library/jest-dom/vitest'`), mesmo padrão do
  `vite-env.d.ts` já existente ao lado — e os `*.test.tsx` **são** type-checados pelo `tsc -b`,
  já que `include: ["src"]` os pega.

### Skills novas

`.claude/skills/testing-strategy/` (que teste uma mudança pede, onde o arquivo vive por segmento
FSD, o que fazer quando o ratchet mexe) e `.claude/skills/gate/` (a cadeia de verificação em 3
tiers, como filtrar a saída sem inundar o transcript, e as armadilhas que este repositório já
pagou). O `dispatch-api` ganhou uma `gate` equivalente.

**Fora de escopo, consciente**: `vitest` não entrou no `lint-staged` (fricção em todo commit sem
CI pra também gatear — o `check`/`gate` é o momento de rodar) e não há meta de 80%; o ratchet
garante a curva, não um número com prazo.

Verificado: `npm run check` (tsc + oxlint + cobertura) exit 0, `npm run build` limpo (jsdom/RTL
são devDependencies, nada vazou pro bundle — chunk principal segue 284 kB / 89 kB gzip), 60/60
testes passando.

## Corte de horário — prazo condicional por horário de entrada (Equipe + Etapa)

Front do que ficou pronto no back — ver `dispatch-api/CLAUDE.md`, mesma seção, pro desenho
completo (genérico por Equipe+Etapa, acréscimo ao `TipoPrazo` normal, fuso de Brasília).

- `entities/protocolo`: `TipoPrazo` ganha `'CorteDeHorario'`; `TIPO_PRAZO_LABEL` ganha
  `CorteDeHorario: 'Corte de horário'`.
- `entities/equipe`: `Equipe` ganha 4 campos `string | null` (`corte{Pre,Pos}ConferenciaHorario
{Corte,Vencimento}`) — `TimeOnly` do back chega como string `"HH:mm:ss"`.
- `features/equipe/{criar,editar}`: os mesmos 4 campos no payload de request.
- **`shared/ui/stepper.tsx`** (novo) — `Stepper` extraído de dentro de `datetime-picker.tsx`
  (era privado ali) pra virar reutilizável; `datetime-picker.tsx` passou a importar dele em vez
  de manter uma cópia própria, comportamento idêntico.
- **`shared/ui/campo-horario.tsx`** (novo) — par hora:minuto digitável (`CampoHorario`, formato
  `"HH:mm"`), reaproveita `Stepper` sem o resto do `DateTimePicker` (data/calendário/popover) —
  é só um horário do dia solto, não um instante completo. Sem `<input type="time">` nativo
  (RNF-07).
- **`EquipeCard.tsx`** — `TIPOS_PRAZO` (as opções de pill de prazo normal) filtra
  `CorteDeHorario` de propósito — nunca é uma escolha direta de `TipoPrazo` base, só um
  resultado transitório calculado pelo back. Abaixo de cada linha de pills (pré/pós), um bloco
  novo opcional (`BlocoCorte`): checkbox "corte de horário" + (quando ligado) dois
  `CampoHorario` ("depois de" / "vence às"). Liga com valores padrão editáveis (16:00/10:00, só
  ponto de partida — qualquer equipe pode usar horários diferentes); desliga limpando os dois
  juntos (nunca um preenchido e o outro nulo, o back rejeitaria com 400). Commit imediato ao
  mudar, mesmo padrão dos pills de prazo — sem passo de "salvar" separado, `PUT /equipes/{id}`
  sempre com o objeto inteiro.

Verificado via Playwright contra a API/Postgres local (spec temporário, apagado depois): ligar
o corte numa equipe nova → `PUT /equipes/{id}` confirmado por resposta (204) → seção "corte de
horário" aparece com os steppers 16:00/10:00 → confirmado via `GET /equipes` que persistiu
certo. Nos dois temas (screenshot escopado ao card, não `fullPage` — a tela acumulou muitas
equipes de sessões de teste anteriores, `fullPage` ficou grande o bastante pra um comportamento
estranho de scroll/render que não se repete escopando ao elemento). `npx tsc -b`, `npm run
build`, `npm run lint` e `npm run test` (132/132) limpos. Regressão permanente
(`auth`/`session-isolation`/`login`/`cursor`) verde.

### Segunda rodada: checkbox nativo feio + clique lento (achado em produção, uso real)

Dois problemas relatados pelo dono usando a feature em produção: o `<input type="checkbox">`
cru destoava do resto do design system (nenhum outro toggle do app usa checkbox nativo), e
clicar nele parecia travar por alguns segundos.

- **`shared/ui/switch.tsx`** (novo, via `npx shadcn add switch`) — mesmo gotcha já catalogado
  nesta sessão pro `pagination.tsx`/`tooltip.tsx`: import quebrado (`from "cn"`) corrigido pro
  alias `@/shared/lib/utils`, `npm uninstall cn` removeu a dependência espúria de novo.
  `size="sm"` (14×24px) pro contexto compacto — o padrão (18.4×32px) ficaria grande demais ao
  lado de texto 11px.
- **Causa real da lentidão, investigada antes de "consertar" qualquer coisa**: `Recalculo
DeVencimentos.AplicarAsync` (o RF-38 que roda a cada `PUT /equipes/{id}`) não tem nenhum
  N+1 nem query ineficiente — é 2 buscas + um loop em memória + 1 save. A lentidão real é a
  combinação de (a) nenhum feedback visual antes de o `PUT` completar (checkbox só mudava
  depois do round-trip inteiro: rede + recálculo + refetch) com (b) o cold start normal do
  Render/Neon no plano free (já documentado, fora do nosso controle sem virar plano pago) —
  antes, nenhuma outra ação do app dependia de feedback tão imediato quanto um toggle.
- **`BlocoCorte`** (`EquipeCard.tsx`) ganhou estado otimista local — mesmo padrão de "ajusta
  durante o render, sem efeito" já usado no `nome` deste mesmo arquivo: um valor otimista é
  mostrado na hora do clique (switch liga/desliga, steppers mudam), e some sozinho assim que os
  dados reais (`equipe.corte*`) alcançam o que já foi exibido — sem esperar o `PUT` completar
  pra reagir, mas sem inventar um sistema de rollback genérico só pra isso (o padrão
  "commit imediato, sem undo" já é como o resto da tela funciona).

Verificado via Playwright (spec temporário, apagado depois): `page.route` atrasando a resposta
do `PUT` artificialmente em 2s, confirmado que o texto "depois de"/"vence às" aparece em menos
de 300ms do clique (prova que é otimista, não só round-trip rápido por acaso) — e que o valor
persiste de verdade assim que a chamada atrasada completa. Nos dois temas. `npx tsc -b`, `npm
run build`, `npm run lint` e `npm run test` (132/132) limpos. Regressão permanente verde.

## "+N protocolos" (RF-18c) — fechar o detalhe devolvia pro quadro, não pra lista

Relatado pelo dono: clicar num protocolo dentro da lista completa ("+N protocolos", RF-18c)
abre o painel de detalhe — até aqui certo — mas fechar o painel devolvia direto pro quadro
principal, "perdendo o lugar" na lista. A distribuidora precisava clicar em "+N protocolos" de
novo e reencontrar o mesmo protocolo.

**Causa**: `ListaCompletaColunaSheet.tsx` fechava a si mesma (`onFechar()`) no mesmo clique que
abria o detalhe (`onAbrirDetalhe(id)`) — perdendo de vez a intenção "a distribuidora queria
estar vendo essa lista".

**Fix, sem inventar um sistema de navegação novo**: `listaCompletaAberta` (estado local de
`ProtocoloColuna.tsx`) muda de sentido — passa a significar "o usuário quer ver a lista", não
"a lista está visível agora". O clique num item da lista só chama `onAbrirDetalhe`, nunca mais
fecha a si mesma. A visibilidade real do `Sheet` vira `listaCompletaAberta && !detalheAberto` —
`detalheAberto` é uma prop nova (`DistribuicaoBoard.tsx` → `AbaPorConferente`/`AbaPorStatus` →
`ProtocoloColuna`), computada como `protocoloDetalheId !== null`. Enquanto o painel de detalhe
está aberto, a lista fica visualmente escondida (sem perder o estado); assim que o painel
fecha, ela reaparece sozinha, com a mesma rolagem/posição — sem round-trip de rede nenhum
envolvido, é só re-render local.

`ListaCompletaPoolSheet.tsx` (Minha fila/Fila do conferente, mesmo padrão de "+N protocolos")
**não precisou do mesmo fix** — RF-24e (clicar no card abre o painel de detalhe) ainda não
existe em nenhuma coluna de Minha fila (gap já documentado), então não tem "voltar pro detalhe"
nenhum pra perder ali.

Verificado via Playwright contra a API/Postgres local (spec temporário, apagado depois): criados
7 protocolos pra estourar o truncamento da coluna "Pool aberto", aberto "+N protocolos", clicado
no primeiro item (painel de detalhe abre, lista some), fechado o painel ("Fechar") — confirmado
que a lista completa reaparece sozinha, com o mesmo item visível, sem precisar reabrir "+N
protocolos". `npx tsc -b`, `npm run build`, `npm run lint` e `npm run test` (132/132) limpos.
Regressão permanente verde.
