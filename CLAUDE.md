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
  por engano, de um flag de *init* da CLI que eu tratei como campo persistível ao corrigir o bug
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
fila). Ainda não existem testes de unidade (vitest) nem lint rodado a sério (eslint/oxlint já
vem do scaffold do shadcn, mas ainda não foi ligado ao fluxo). Próximo passo natural: Central de
regras (RF-31 a RF-38) ou Conferentes (RF-25 a RF-30) — usando as skills
`new-entity`/`new-feature`/`new-page` e fechando com `verify-visual`.
