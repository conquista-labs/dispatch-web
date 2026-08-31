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
- **`DateTimePicker`, quinta rodada — bug real de dado, não só de fidelidade** (dono reportou:
  "não é possível editar data e hora digitando" e "linha de corte não filtra", usando um lote
  real de 12 linhas e corte "10:57"). As duas queixas eram a mesma causa:
  - O seletor (igual o protótipo, que também não tem digitação — só clique) só dava pra ajustar
    data via calendário e hora/minuto via stepper −/+ um em um. Pra chegar em "10:57" a partir de
    qualquer outro valor, seriam dezenas de cliques — na prática o usuário mexe só no
    hora/minuto e esquece de clicar no dia certo no calendário, deixando a *data* errada sem
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
  + trigger de duas linhas + lista com indicador de seleção), substituindo o antigo botão "Ver
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
+ normalização"). `NovoTipoAtoDialog` (mesmo padrão de `NovaEquipeDialog`), `features/tipoAto/criar`
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

*"Nenhum nome de registro pode ser truncado em tela cuja função é distinguir registros
parecidos (catálogo de tipos, lista de escreventes): o nome quebra em linha."* Levantamento
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

## Índice de confiança real da sugestão (RF-39)

Fecha a simplificação consciente documentada desde a construção da Central de Regras — ver
`../dispatch-api/CLAUDE.md`, seção "Índice de confiança real da sugestão", pra fórmula. `Sugestao`
(`entities/sugestao/model/types.ts`) ganhou `indiceConfianca: number` (0.0–1.0).
`AbaAprendizado.tsx` — cada card de sugestão pendente ganhou uma barra
(`shared/ui/progress.tsx`, já com o bug de `value` corrigido nesta sessão) + "N% de confiança",
mesma posição do protótipo aprovado (badge de classe à esquerda, barra+percentual à direita, na
mesma linha do topo do card). Chips de "casos concretos" continuam de fora — `Sugestao` só
carrega evidência agregada (texto) e contagem, nunca uma lista de exemplos específicos.
