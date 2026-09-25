# Histórico de entregas — dispatch-web

> Narrativa das entregas, em ordem cronológica (mais antiga primeiro, mais recente no fim). Veio
> do antigo `CLAUDE.md` (até 2026-09-25), condensada sem perder fatos: o que foi construído, em
> quais arquivos, o que foi verificado. Datas pelos commits (`git log`); "~" quando a entrega não
> tem commit próprio identificável.
>
> **Este arquivo é consulta, não leitura obrigatória.** Decisões vivem em
> [`decisions/`](decisions/), lições reutilizáveis em [`patterns/`](patterns/), pendências em
> [`gaps-requisitos.md`](gaps-requisitos.md). Entrega nova ganha uma seção `##` no fim; se nela
> houver decisão, ela vira ADR (skill `/web-adr`); se houver lição, vai pro pattern doc.
>
> Referências a `Dispatch.dc.html` são ao protótipo aprovado com o nome da época (hoje
> `Dispatch v2.dc.html`). "Verificado nos dois temas" = Playwright, screenshot lido, claro e escuro.

---

## 2026-08-27 — Scaffold, autenticação ponta a ponta

- Vite + React 19 + TS, FSD (`app/pages/widgets/features/entities/shared`) —
  [ADR-0001](decisions/0001-adotar-feature-sliced-design.md).
- Login, `GET /auth/me` no boot (`SessionBoot`), guarda de rota por papel (`RequireRole`,
  `roleHomeRoute`), logout; `configureHttpClient` ligado em `app/App.tsx` —
  [ADR-0002](decisions/0002-sessao-sem-decodificar-jwt.md).
- A API precisou de `AddCors`/`UseCors` (Development, `http://localhost:5173`) — `curl`/Postman
  não fazem preflight, só o browser ([deploy](patterns/deploy.md)).

## 2026-08-27 — Design system fiel ao protótipo aprovado

- shadcn/ui (estilo `radix-nova`) com aliases em `shared/ui`/`shared/lib`; cores (escala zinc),
  tokens extras (`text-2..5`, semáforo), Instrument Sans + JetBrains Mono self-hosted, logo
  ampulheta com variantes `on-light`/`on-dark-fixed`, tema claro/escuro (RF-04) com script inline
  anti-flash — [ADR-0003](decisions/0003-prototipo-aprovado-como-fonte-de-design.md),
  [design-system](patterns/design-system.md).
- Armadilhas do `shadcn add` (baseUrl no tsconfig raiz, aliases do `components.json`) e do rename
  de caixa no macOS — [shadcn-gotchas](patterns/shadcn-gotchas.md).

## 2026-08-27 — Playwright + skills do projeto

- `@playwright/test`, `e2e/` e as skills `new-entity`, `new-feature`, `new-page`,
  `add-shadcn-component`, `verify-visual` (nenhuma sessão tinha browser interativo) —
  [ADR-0020](decisions/0020-playwright-com-duas-categorias-de-spec.md).
- `cursor: pointer` em botões tinha sido desligado pelo `shadcn init --no-pointer`: regra global
  em `@layer base` + `e2e/cursor.spec.ts`.

## 2026-08-27 — Minha fila (RF-19 a RF-24), primeira tela real

- `entities/protocolo` — tipos espelhando `ProtocoloResumo`/`ProtocoloConcluidoResumo`,
  `useMinhaFila`/`useConcluidosHoje`.
- `features/minha-fila/{pegar-protocolo,iniciar-conferencia,concluir-conferencia}` +
  `features/protocolo/definir-observacao` (RF-20/21/22, RF-15/23), cada um invalidando a query
  certa.
- `widgets/minha-fila-board` — 3 colunas + concluídos hoje, cronômetro ao vivo (RF-21; exigiu
  `IniciadoEm` novo no `ProtocoloResumo` do back — gap achado e fechado na hora), chip de prazo
  pelas 4 faixas.
- Primitivos novos: `shared/ui/chip.tsx`, `shared/ui/surface-card.tsx`; `shared/lib/format.ts`
  (duração/cronômetro) e `shared/lib/use-now.ts` —
  [ADR-0004](decisions/0004-cva-e-primitivos-contra-parede-de-classes.md).

## 2026-08-27 — Bug crítico: vazamento de sessão entre usuários

Deslogar de um papel e logar com outro mostrava a sessão anterior primeiro — o cache do TanStack
Query não tinha escopo por usuário. `queryClient.clear()` no logout, no login e no handler de 401;
regressão permanente `e2e/session-isolation.spec.ts`.

## 2026-08-27 — Distribuição (RF-13 a RF-18)

- `entities/conferente` (`GET /conferentes`, fecha o nome de dono nas visões);
  `useVisaoDistribuicao` (`GET /protocolos/distribuicao`).
- `features/protocolo/{redistribuir-pool,atribuir-manualmente,descartar-excecao}` (RF-16/RF-17).
- `widgets/distribuicao-board` — 3 abas (por conferente, por status, exceções), reaproveitando
  `SurfaceCard`/`Chip`/`ObservacaoField`. `ObservacaoField` migrou pra dentro da feature
  `definir-observacao` (as duas telas usam).
- Corrigido no caminho: os cards de Minha fila só pintavam o chip, não o card inteiro, pela faixa
  do semáforo — `SurfaceCard` ganhou a variante `tom`.
- Simplificações conscientes da época (fechadas depois, ver [gaps](gaps-requisitos.md) §11–12): sem
  nome de escrevente/equipe no card, sem badge "Alta". O botão "Importar relatório" ficou fora do
  header até a rota existir.

Verificado: `tsc --noEmit`, `npm run build`, `verify-visual` completo em Minha fila e Distribuição
com dado real criado via API (conferentes, protocolos em cada estado/bucket/exceção), login de
verdade, nos dois temas; "Pegar este" e troca de sessão clicados. Dado de teste limpo.

## 2026-08-27 — Importar relatório (RF-05 a RF-12), 3 passos

O protótipo mudou de 2 pra 3 passos (dados → revisão → distribuição); o back ganhou RF-08 pro
passo do meio.

- `features/protocolo/importar-lote` — `usePreVisualizarLote`/`useConfirmarLote`, tipos espelhando
  `ImportarLoteRequest`/`ResumoImportacao` (`linhas: LinhaPreviaImportacao[] | null`, nulo na
  confirmação).
- `entities/protocolo` ganha `TipoPrazo` e `lib/rotulos.ts` (`ETAPA_LABEL`/`TIPO_PRAZO_LABEL`);
  "5º andar · pós-conferência" é montado no front
  ([ADR-0006](decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)).
- `widgets/importar-lote-wizard` — `PassoDados` (etapa + linha de corte + textarea) →
  `PassoLinhas` (RF-08: linha a linha com prazo, regra e "leitura" — `N com alçada`/`tipo novo`/
  `já existe`, reaproveitando `prazoChip`) → `PassoPrevia` (prévia agregada, avisos, confirmar;
  RF-10/RF-11).
- Controles nativos trocados por shadcn (`select`/`popover`/`calendar` + `shared/ui/datetime-picker.tsx`
  próprio) a pedido do dono; `date-fns`/`react-day-picker` vieram com o `calendar`.
- Gotcha nº 3 do `shadcn add`: campo `"pointer": true` no `components.json` quebrava todo `add` —
  removido ([shadcn-gotchas](patterns/shadcn-gotchas.md)).
- Simplificação consciente: só colar linhas, sem `.csv`/`.xlsx` de verdade ([gaps §1](gaps-requisitos.md)).

Verificado: os 3 passos contra a API local com CSV real (6 linhas, tipos conhecido e
desconhecido), `e2e/importar.spec.ts` + tema escuro. Dado limpo. Com isso o fluxo principal de
entrada (Importar → Distribuição → Minha fila) fechou.

## 2026-08-27/28 — Fidelidade de Importar e Distribuição, navegando o protótipo de verdade

- **Descoberta**: o `.dc.html` pode estar desatualizado em relação à ferramenta ao vivo (o dono
  flagrou; reexportou e bateu). E o `.dc.html` **roda num navegador** — abrir via `file://` com
  Playwright virou o método padrão de fidelidade
  ([verificacao-com-prototipo](patterns/verificacao-com-prototipo.md)).
- `SeletorEtapa` (`Popover` com trigger de duas linhas e rádio customizado, dentro de
  `PassoDados.tsx`) — o `Select` do shadcn não mostra duas linhas no campo.
- `DateTimePicker`, rodadas 2–5:
  - trigger com ícone + "data · hora" (sem "às"); hora/minuto em steppers −/+ (`Stepper`);
    `locale={ptBR}`;
  - JetBrains Mono nos dias e na letra do dia da semana via seletor de descendente
    (`[&_.rdp-weekday]:font-mono [&_.rdp-day_button]:font-mono`); dias da semana em uma letra
    (`formatters.formatWeekdayName`); atalhos "Início do dia"/"Agora"/"Pronto" (clicar no dia não
    fecha — igual o protótipo);
  - `PopoverContent` `w-[266px]` com `[--cell-size:35px]` (grade 261px, 2,5px de folga por lado,
    medido); `autoFocus` removido (anel de foco em "hoje" competindo com o dia selecionado);
  - **bug real de dado**: sem digitação, o usuário acertava hora/minuto e deixava a data errada; e
    o default era `Date.now() - 10 anos` (o protótipo usa hoje 00:00), então a linha de corte nunca
    filtrava. Data e hora viraram digitáveis (divergência deliberada, RF-07,
    [ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)) e o default voltou a hoje
    00:00. Confirmado digitando "10"/"57" contra o CSV de 12 linhas do dono: `8 ignoradas / 4
processadas`.
- Indicador de passo do wizard virou círculo numerado + linha (`IndicadorDePassos`); rodapé do
  textarea com "N linhas coladas" e "Ler N linhas".
- Distribuição: legenda de prazo nas 3 abas, com texto/cor das faixas reais (4h/60min, cor "bar");
  prop `variant` (`'conferente' | 'status'`) em `ProtocoloColuna`/`DistribuicaoProtocoloCard`
  (coluna fixa 206px + cabeçalho em card com badge vs. coluna elástica + cabeçalho plano; prazo em
  chip vs. texto colorido); truncamento "+N protocolos" depois de 3 (conferente) / 4 (status);
  cabeçalho com os 4 segmentos do resumo ("nenhum" por extenso) e o botão "Importar relatório";
  `ObservacaoField` ganhou `somenteLeitura` (só Minha fila edita); `ExcecaoCard` com `Select` do
  shadcn e tag dinâmica `tagDaExcecao`.
- **Bug real**: `prazoChip` prefixava "vence em"/"estourou há" em toda faixa — o verde mostra só a
  duração. Corrigido no helper compartilhado.
- Gaps da época documentados (fechados depois, [gaps](gaps-requisitos.md) §10–11): "N feitos hoje",
  tempo no canto do concluído, linha de tipo de ato.
- Verificação de comportamento (cobrada pelo dono): observação em Minha fila, Distribuição só
  lendo, "Resolver" exceção — revelou o auto-atribuir do protótipo; mantido o seletor manual
  ([ADR-0009](decisions/0009-manter-atribuicao-manual-de-excecao.md)).

## 2026-08-28 — Conferentes (RF-25 a RF-30)

Planejar a tela achou no back um bug adormecido (`CargaAtual` nunca atualizado — desempate por
carga comparava 0 com 0) e dois gaps (RF-28 capacidade estimada, RF-30 aviso de cobertura).

- `entities/conferente` ganha `capacidadeEstimada`, `AlcanceDoConferente` (`useAlcance`,
  `GET /conferentes/alcance`) e `CoberturaAlcada` (`useCobertura`, `GET /conferentes/cobertura`).
- `features/conferente/{cadastrar,editar-nivel-jornada,editar-perfil,marcar-presenca,remover}`;
  presença/remoção invalidam também a visão de Distribuição (RF-27).
- `widgets/conferentes-board` — `ConferentesBoard` (4 KPIs + lista + banner de cobertura),
  `ConferenteCard` (nível em pill que cicla Júnior→Pleno→Sênior; jornada em stepper ±1h, 2–12h),
  `NovoConferenteDialog`, `EditarConferenteDialog` (edição passou por "sem edição" → inline → modal;
  cadastro é modal porque o back exige e-mail/senha — [ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)).
- Achados no back testando a tela: lista sem `ORDER BY` pulava de posição; "Remover" não filtrava
  removidos.
- Frase completa de alçada por conferente ficou pra depois (fechada em 2026-09-03).
- `e2e/conferentes.spec.ts` (regressão permanente) — cadastra, edita nome via modal, remove; usa
  `data-testid="conferente-card-{id}"`.

## 2026-08-28 — "Minha fila" da Distribuidora (RF-19, leitura)

Achado só depois de um print do dono: o `nav` do protótipo libera todos os itens pra gestão.
Rota própria `ROUTES.filaConferentes` (`/fila-conferentes`), mesmo rótulo de menu.

- `pages/fila-conferentes` — seletor "VER COMO" (`SeletorConferente`, primeiro `Select`, depois
  `Popover` com trigger de duas linhas quando o protótipo trocou o botão de ciclar): nível + carga
  à direita, ausente com opacidade reduzida mas selecionável, item ativo com `bg-secondary` na
  linha inteira (faltava aqui e no `SeletorEtapa`), padrão = primeiro na escala.
- `widgets/fila-do-conferente-board` — reaproveita `ProtocoloCard`/`EmConferenciaCard`/
  `ConcluidosHojeList` pelo barrel de `minha-fila-board`, com `somenteLeitura`.
- `useFilaDoConferente(id)`/`useConcluidosHojeDoConferente(id)` com o id na `queryKey`. Nenhuma
  mutation (os endpoints de ação rejeitam quem não é Conferente, RNF-04).
- `e2e/fila-conferentes.spec.ts` (regressão) — nenhum botão de escrita; trocar conferente dispara
  `GET /conferentes/{id}/fila`.

## 2026-08-28 — Deploy no Netlify

Site `lab-dispatch-web`, `netlify.toml` com redirect de SPA, `VITE_API_URL` por `netlify env:set`,
deploy sempre `netlify deploy --prod --build` —
[ADR-0022](decisions/0022-deploy-manual-no-netlify-com-build-remoto.md), [deploy](patterns/deploy.md).
Em 2026-08-31 a URL da API passou pro Render.

## 2026-08-28 — Central de regras (RF-31 a RF-41), as 3 abas

Aprendizado, Alçada, Prazos por equipe. O back já estava pronto; faltava `GET /tipos-ato`.

- Cinco entidades: `tipoAto`, `regraAlcada`, `equipe`, `escrevente`, `sugestao`. `NIVEL_LABEL` subiu
  pra `entities/conferente/lib/rotulos.ts` na terceira repetição.
- `fraseDaRegra` monta "Nível Júnior não pode conferir Inventário" a partir do fato cru —
  reaproveitada pela lista e pelo preview do construtor (RF-32).
- Construtor guiado (RF-32): UI pura, uma regra por alvo selecionado (`Promise.all`) —
  [ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md).
- `widgets/central-de-regras-board` — `AbaAprendizado`/`AbaAlcada`/`AbaPrazos`; `PillToggle`
  (cores do JS do protótipo) nos três.
- `EquipeCard`: nome salva no blur (cada `PUT /equipes/{id}` recalcula vencimentos, RF-38); prazo
  pré/pós aplica no clique.
- Sem índice de confiança, sem chips de casos concretos, KPIs do Aprendizado derivados de dado
  real; sem excluir equipe (o protótipo também não tem).
- `e2e/central-de-regras.spec.ts` (verificação pontual das 3 abas + construtor, dois temas).
  Comportamento testado à parte: regra multi-alvo (2 POSTs), ativar/desativar, remover, mover
  escrevente órfão, aplicar/descartar sugestão — confirmados por rede.

## 2026-08-28 — Cadastro manual de tipo de ato; catálogo na aba Alçada

`NovoTipoAtoDialog` (molde de `NovaEquipeDialog`) + `features/tipoAto/criar` (`POST /tipos-ato`;
409 se o nome normalizado já existe, tratado como duplicidade de e-mail). Complementa o cadastro
automático da importação. Confirmado: 201 e duplicata com caixa diferente → 409.

## 2026-08-28 — Badge de pílula no menu lateral (RF-13/RF-39)

`AppShell`: "Distribuição" mostra `N exc` (aviso) se houver exceção, senão o tamanho do pool, senão
nada; "Central de regras" mostra a fila de aprendizado. `useVisaoDistribuicao`/
`useSugestoesPendentes` ganharam `{ enabled }` (não disparam pra Conferente). `NavBadge` local, não
o `Chip` ([ADR-0016](decisions/0016-badges-proprios-e-variante-fonte-no-chip.md)).

## 2026-08-28 — Painel de detalhe do protocolo (RF-18a/b)

Primeira frente do "v2" do protótipo/requisitos. Drawer de 432px aberto ao clicar em qualquer card
de Distribuição.

- `shared/ui/sheet.tsx` (shadcn, não feito à mão — cobrança do dono), `showCloseButton={false}`.
- `widgets/painel-detalhe-protocolo` — `PainelDetalheProtocolo` (`protocoloId | null` + `onFechar`),
  reaproveitando `ObservacaoField`, `fraseDaRegra`, `prazoChip`/`Chip`; `DetalheProtocolo`/
  `useDetalheProtocolo(id)` com `enabled: !!id`.
- `features/protocolo/devolver-ao-pool` e `atribuir-ao-menos-carregado` (invalidam a visão e o
  detalhe).
- `formatDataHora` subiu pra `shared/lib/format.ts` (terceira repetição).
- Cards com `onClick` inteiro; botões internos com `stopPropagation`.
- Testado contra a API: 204/409 conferidos, card atrás do painel atualiza sozinho.

## 2026-08-28 — Central de Regras: "Regras em vigor" (aba padrão) e "Tipos de ato"

- `AbaRegrasEmVigor.tsx` — frases por família (Alçada, Prazo, Catálogo, Operação) sem endpoint novo,
  com "Editar X" trocando de aba. "Operação" só com o que existia (Híbrido, 1 ato simultâneo,
  faixas do semáforo).
- `AbaTiposDeAto.tsx` (RF-34a-b,d-f) — `useTiposAtoComUso` (`GET /tipos-ato/com-uso`),
  `features/tipoAto/{renomear,alterar-status,definir-peso,remover}`; `TipoAtoRow` (nome no blur,
  peso em stepper, pill ativo/inativo, 409 "em uso" inline). RF-34c (mesclar) fora
  ([gaps §3](gaps-requisitos.md)).
- A lista de tipos do construtor segue chips de leitura (propósito diferente).
- **Bug de teste**: locator posicional reusado depois de refetch reordenado renomeou/removeu a
  linha errada duas vezes ([e2e-tests](patterns/e2e-tests.md)).
- Spec ganhou as duas abas e um teste de comportamento de Tipos de ato; precisou de
  `Escrevente Orfao E2e` seedado.

## 2026-08-31 — Correção de resultado + pedido de reabertura (RF-24a-d)

Junto: peso de tipo de ato digitável (RF-34f, `<input>` ao lado do stepper).

- `ConcluidosHojeList` ganhou `now` e `somenteLeitura`: dentro da janela de 15 min, contagem +
  "Corrigir para…"; com pedido pendente, "Reabertura solicitada" + "Cancelar pedido"; fora da
  janela, "Pedir reabertura à distribuidora". Features `corrigir-resultado`, `pedir-reabertura`,
  `cancelar-pedido-reabertura`.
- `entities/pedidoReabertura` (`GET /protocolos/pedidos-reabertura`).
- `AbaExcecoes` com "Pedidos de reabertura · N" (`PedidoReaberturaCard`, Reabrir/Negar); rótulo da
  aba `Exceções · N · M pedido(s)` (RF-18b). Feature `decidir-pedido-reabertura`.
- Painel de detalhe: `podeReabrirConferencia` + linhas `Corrigido`/`Reaberto` na timeline. Feature
  `reabrir-conferencia`.
- Lições de teste: `data-testid` (`concluido-*`, `pedido-reabertura-*`), `page.clock` escopado ao
  contexto ([e2e-tests](patterns/e2e-tests.md)).
- `e2e/correcao-reabertura.spec.ts` — cenário próprio via API, relógio avançado 16 min, decisão
  como distribuidora; limpa sobras no início (RF-21).

## 2026-08-31 — Dashboard (RF-42-46)

- `entities/dashboard` (`useDashboard(periodo)`); rota `dashboard` com
  `RequireRole(['Distribuidora','Conferente'])` — primeira rota dos dois papéis; o back decide o
  que devolver.
- `npx shadcn add progress table` — primeira `<table>` real.
- `widgets/dashboard-board` — tabs de período; `VisaoGestao` (KPIs + desempenho/score/faixa + por
  tipo) e `VisaoConferente` (KPIs, score com as 4 parcelas, "Você × média da casa", **sem**
  faixa de bônus — RF-45). `KpiCard` no padrão do Aprendizado.
- **Bug do `Progress` gerado** (não repassava `value`) — [shadcn-gotchas](patterns/shadcn-gotchas.md).
- `e2e/dashboard.spec.ts` — gestão (troca de período refaz a busca) e conferente (afirma que
  "Bônus"/faixa e nomes de colegas **não** aparecem).
- Dois specs antigos consertados de passagem (`getByText` sem `exact` com dado acumulado).
- Na época: sem vitest nem lint a sério (resolvido em 2026-09-03). Próximos passos listados então:
  carga acumulada na rodada de importação (back), RNF-10, índice de confiança da sugestão e
  cumprimento de prazo por equipe — todos feitos nos dias seguintes.

## 2026-08-31 — Dashboard como home e primeiro item do menu (RF-03)

(Do commit `196ac77`.) Os dois papéis caem no Dashboard após o login; specs que dependiam do
redirect antigo passaram a navegar explicitamente.

## 2026-08-31 — Lazy loading por página

[ADR-0005](decisions/0005-lazy-loading-por-pagina.md): bundle único de ~655 kB virou chunks por
rota (core ~241 kB; telas de ~1 a ~96 kB).

## 2026-08-31 — Auditoria de over-fetching

A maioria já estava certa. Dois achados: as 5 queries auxiliares do `PainelDetalheProtocolo`
(sempre montado) ganharam `enabled: !!protocoloId`; `GET /escreventes/sem-equipe` removido
(`AbaPrazos` filtra de `escreventes`). Nenhuma duplicata real de `queryKey`
([dados-e-mutations](patterns/dados-e-mutations.md)).

## 2026-08-31 — RNF-10: nome de registro não trunca

16 ocorrências: corte de dado (`.split(' ')[0]` em `AbaPorConferente`, `AbaPorStatus`,
`AbaRegrasEmVigor`) e truncamento CSS (`ConferenteCard`, `FilaConferentesPage`, `AbaAlcada`,
`PassoLinhas`/`PassoPrevia`, `DistribuicaoProtocoloCard`, `PainelDetalheProtocolo`, `AppShell`,
`ExcecaoCard` — este com override local `data-[size=default]:h-auto`). Padrão em
[lists-and-long-content](patterns/lists-and-long-content.md).

## 2026-08-31 — Índice de confiança real da sugestão (RF-39)

`Sugestao.indiceConfianca` (0–1); `AbaAprendizado` com barra (`Progress`) + "N% de confiança" na
posição do protótipo. Chips de casos concretos seguem fora.

## 2026-08-31 — Motor de alçada v2: equipe, alçada plena, grupo de tipo (só o construtor)

- `RegraAlcada`/`CriarRegraAlcadaRequest`: `alvoEhEquipe`, `alvoEquipeId` (`null` = "sem equipe",
  RF-29a), `alvoTodosOsAtos` (RF-29b); `fraseDaRegra` com as frases novas; call sites buscando
  `useEquipes()`.
- `TipoAto.grupo` (5 valores fixos), `GRUPO_LABEL`, `features/tipoAto/definir-grupo`.
- Construtor com alvos `'equipe' | 'todos'` (sentinela `SEM_EQUIPE` → `null` só no request);
  `TipoAtoRow` com `Select` de grupo.
- Verificado contra cópia real dos dados de produção (Analista Júnior com 1/3 tipos, batendo com o
  bug relatado), nos dois temas. A reformulação visual da aba ficou pro v3.

## 2026-09-01 — Distribuição/Minha fila v2: prioridade, RF-14, RF-16, RF-18c, filtros

- Prioridade manual: `definir-prioridade`; painel alterna "Marcar como urgente"/"Remover urgência"
  em estados ativos.
- RF-14 no card de Distribuição via `resolverInfoProtocolo` → `InfoProtocolo`; equipe `null` em
  vermelho ([ADR-0006](decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)).
- RF-16: "Redistribuindo…" com `Loader2Icon`.
- RF-18c: "+N protocolos" abre `ListaCompletaColunaSheet` (todos, por vencimento); sem "quantos têm
  alçada" por item ([gaps §29](gaps-requisitos.md)).
- RF-18e/RF-24f: `widgets/filtro-protocolos` client-side
  ([ADR-0007](decisions/0007-filtros-de-protocolo-no-cliente.md)).
- Bugs: Rules of Hooks (hook depois de early return, achado em revisão —
  [codigo-react](patterns/codigo-react.md)); 403 silencioso das leituras auxiliares pra Conferente
  (corrigido no back; spec com asserção de contagem).
- Verificado (`e2e/distribuicao-v2.spec.ts`, dois temas): badge urgente, RF-14 com e sem equipe,
  "Redistribuindo…" via `page.route`, lista expandida → detalhe, filtros isolados e combinados,
  filtro de Equipe em Minha fila reduzindo de verdade. 239 testes do back verdes.

## 2026-09-01 — Motor de alçada v3: aba Alçada em Camadas/Matriz/Testar

- `AbaAlcada` virou contêiner (pills das 3 sub-abas + construtor único); alvo `'grupo'` e
  permissão `'Reserva'`; `abrirBuilderParaCamada`.
- `AbaAlcadaCamadas` — 3 seções fixas (Base por nível / Ajuste por equipe / Exceção por pessoa) via
  `camadaDe` (réplica de `ResolvedorAlcada.CamadaDe` só pra agrupar); "O que cada um alcança hoje"
  migrou pra cá.
- `AbaAlcadaMatriz` — grupo/tipo × pessoa cruzando `/conferentes/alcance` com `/tipos-ato`; clique
  cria/remove só a regra atômica ([ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)).
- `AbaAlcadaTestar` — `POST /regras-alcada/testar` (`useTestarAlcada`), veredito, "Podem conferir"/
  "Barrados e por quê" com trilha; sem "SAÍDAS".
- `entities/regraAlcada`: `alvoGrupo`, frase de Reserva ("Só X confere Y"), `MotivoAlcada`,
  `PassoTrilha`, `AvaliacaoAlcada`, `MOTIVO_ALCADA_LABEL`; `AlcadaConferente` virou alias de
  `AvaliacaoAlcada` (`import type` nos dois sentidos). Painel mostra o motivo de quem está barrado.
- Ajustes: botão "Novo tipo de ato" removido do cabeçalho; `SeletorUnico`/`SeletorMultiplo` no
  construtor ("Quem", valor do alvo, Permissão) — consistência interna, não protótipo.
- Achado: colunas da Matriz coladas — dev server sem recompilar CSS novo; reiniciar resolveu
  ([tailwind](patterns/tailwind.md)).
- Verificado (`e2e/alcada-v3.spec.ts`, dois temas) com regras criadas via API; trilha do Testar
  conferida também via `curl`.

## 2026-09-01 — Pool ordenado + "+N protocolos" em Minha fila; cards compactados

- Pool já vem ordenado por vencimento do back.
- `ListaCompletaPoolSheet` (Minha fila, reaproveitando `ProtocoloCard`; "Pegar este" funciona no
  Sheet; `somenteLeitura` na Fila do conferente). Verificado com 16 itens (3 + "+13").
- Pedido do dono: truncamento de 3 → 5 (`ProtocoloColuna` variant conferente, `MAX_POOL_VISIVEL`).
- `ProtocoloCard` ganhou `info: InfoProtocolo` (tipo de ato, chips de equipe + etapa, escrevente) —
  a "simplificação" de Minha fila estava desatualizada pelo protótipo v2.
- `DistribuicaoProtocoloCard`/`ListaCompletaColunaSheet`: equipe como texto (não `Chip`), linha
  única "Escrevente · Equipe · Etapa", depois truncada com `title` (RNF-10 não se aplica ali —
  [ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)); `p.tipo` corrigido pra
  `12.5px` `text-text-5` (Distribuição) / `13px` (Minha fila); escrevente de Minha fila `11.5px`.
- `Chip` compartilhado não mexido (gap fechado em 2026-09-03 com a variante `fonte`).

## 2026-09-01 — Painel de Filtros redesenhado (protótipo reexportado)

Eixos viraram `Combo` num painel deslizante; busca livre e dia do vencimento no toolbar; eixo Prazo
vira alternador "urgente" — [ADR-0008](decisions/0008-eixo-prazo-como-alternador-urgente.md).
Arquivos: `entities/protocolo/lib/filtros.ts`, `FiltroEixo` (reescrito), `PainelFiltros` (novo),
`BarraDeFiltros` (toolbar inteiro), `shared/ui/date-picker.tsx` (novo); legenda e toolbar em
linhas separadas nos 3 boards. Verificado lado a lado com o protótipo, nos dois temas (busca sem
acento, badge ignorando busca/data).

## 2026-09-01 — Cumprimento de prazo por equipe (RF-43, lado front)

Consome `cumprimentoPrazoEquipe` do `GET /dashboard`. "Por tipo de ato" deixou de ser `Table`
cheia: os dois blocos lado a lado (`grid grid-cols-1 md:grid-cols-2 gap-2`, depois
`mobile:grid-cols-2`), cards compactos com `border-t` entre linhas (`gridDois` do protótipo).
Limiares ≥90%/≥70% com os tokens do semáforo; ordem vem do back; "N atos" sem plural é fidelidade.
Tipo `CumprimentoPrazoEquipe` (`equipeId: string | null`). Dado de teste criado via fluxo real (3
protocolos). `e2e/dashboard.spec.ts` ajustado pro rótulo novo; o teste de visão conferente falha
por falta de concluídos da conta (pré-existente).

## 2026-09-01 — "Concluídos hoje" de Minha fila fiel ao protótipo

Achado pelo dono ("fonte estranha"). Releitura de `feitosCards`: faltava a linha de tipo de ato
(`nomePorTipoAtoId`); "janela de correção encerrada" solto em mono era o texto estranho — no
protótipo só existe com o eyebrow "MARCOU ERRADO? · ", e no estado encerrado não há texto, só o
botão; faltava o indicador de "corrigido" (`corrigidoEm`); status virou `Chip`; ações empilhadas
com botão largura total. RF-24e (card abre o detalhe) segue ausente em Minha fila
([gaps §2](gaps-requisitos.md)). Verificado nos três estados reais, dois temas.

## 2026-09-01 — Protocolo manual: criar, editar, excluir com desfazer (RF-18f a RF-18j)

- `SeletorUnico`/`PillToggle` movidos pra `shared/ui`; `SeletorUnico.permiteValorLivre` (RF-09).
- `shared/ui/sonner.tsx` (troca de `next-themes` por `useThemeStore`), `shared/ui/alert-dialog.tsx`.
- `widgets/protocolo-manual/ui/ProtocoloManualDialog.tsx` — criar/editar
  (`protocoloParaEditar`), prévia ao vivo via `useSimularProtocoloManual` (só com tipo e
  escrevente preenchidos, sem persistir).
- Bug: escrevente novo fora do cache + `useEffect` sem `escreventes` nas deps
  ([dados-e-mutations](patterns/dados-e-mutations.md)).
- Painel: "Editar protocolo" e "Excluir" (`AlertDialog` com aviso por status) numa seção separada;
  excluir → toast "Desfazer" (8s). Botão "Novo protocolo" entre "Redistribuir pool" e "Importar
  relatório".
- Testado ponta a ponta (prévia, escrevente novo, edição recalculando vencimento, excluir,
  desfazer restaurando tudo).

## ~2026-09-01 — Login: mostrar/ocultar senha

`EyeIcon`/`EyeOffIcon` no campo. `aria-label` "Mostrar senha" colidia com `getByLabel('Senha')` e
quebrava a suíte — renomeado pra "Mostrar/ocultar caracteres digitados".

## 2026-09-01 — Modal de protocolo manual, segunda passada de fidelidade

Releitura de `novoAberto`: Observação também no "Criar" (o back passou a aceitar); `SeletorUnico.sub`
(segunda linha); "Excluir" dentro do modal de edição (`onPedirExclusao`); rodapé `justify-between`;
eyebrow "O QUE O SISTEMA VAI FAZER"; textos de ajuda e placeholder do protótipo; `sm:max-w-[520px]`.
Divergências mantidas: 2 níveis de prioridade (fechado depois) e tipo de ato sem nome livre
([gaps §16](gaps-requisitos.md)).

## ~2026-09-01 — Card do quadro quebrava com prioridade Alta

Achado pelo dono ao vivo (nenhum protocolo de teste tinha Alta). O badge estava na linha do número
e com rótulo "urgente" inventado; o protótipo põe "Alta" na terceira linha, junto da meta.
Corrigido no card e na lista completa, com badge próprio
([ADR-0016](decisions/0016-badges-proprios-e-variante-fonte-no-chip.md)).

## 2026-09-01 — TOTP e recuperação de senha, caminho feliz (RF-01a a RF-01l)

- Duas telas públicas; RF-01m/n fora por decisão do dono ([gaps §4](gaps-requisitos.md)).
- Layout de card único centralizado (`isTotp`/`isRec`), `Logo size="md"` (30px).
- `RegistrarTotpPage` usa o `<LoginForm/>` como portão (divergência de segurança,
  [ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)); `mostrarLinksAuxiliares`.
- QR no cliente com `qrcode.react` (servidor só devolve a URI `otpauth://`); chave em blocos de 4.
- Contador de 30s cosmético no cliente (`30 - (Math.floor(Date.now()/1000) % 30)`, intervalo só no
  passo do código); regras de senha replicadas pra feedback ao vivo (as 3 do
  `Dispatch.Domain.RegrasDeSenha`: 12+ caracteres, não começar com `senha|123|cartorio|dispatch`,
  as duas iguais — o back segue sendo a fonte).
- Bug de infra: 401 de negócio dos endpoints anônimos derrubava a sessão de outra aba →
  `ignorarSessaoEncerrada` ([dados-e-mutations](patterns/dados-e-mutations.md)).
- Tema: decisão de pôr toggle nas telas novas revertida — o `/login` também não tem
  ([gaps §19](gaps-requisitos.md)).
- `e2e/totp-recuperacao-senha.spec.ts` com TOTP de verdade (RFC 6238 em Node), conta própria.
- Achados de teste: screenshot antes do chunk lazy; "degradê" em botão desabilitado é artefato do
  headless ([e2e-tests](patterns/e2e-tests.md)).

## 2026-09-02 — Prioridade com 3 níveis (Baixa/Média/Alta)

`Prioridade = 'Baixa' | 'Normal' | 'Alta'` (valor gravado segue "Normal");
`PRIORIDADE_LABEL`. Quatro arquivos: `ProtocoloManualDialog` (3 botões, default `'Baixa'` como o
protótipo), `PainelDetalheProtocolo` (não colapsa mais tudo em "Normal"), `use-filtro-protocolos`
(3ª opção, "média"). Badge só pra Alta (confirmado no protótipo). Verificado nos dois temas; mesmas
8 falhas pré-existentes da suíte, cada uma conferida.

## 2026-09-02 — Backlog de qualidade de código (auditoria, tudo corrigido)

Feita com 2 agentes em paralelo + revisão direta, cada achado conferido; corrigido em 6 fases, cada
uma com `tsc -b`, build, `verify-visual` e suíte e2e (mesmas 8 falhas pré-existentes).

- **Bug de regra de negócio no front**: o simulador Testar inferia o destino por contagem; o back
  ganhou `SimularAlcada` (roda o motor de verdade) e o front ganhou o campo de prioridade. Mesmo
  caso muda de "pool aberto" (Baixa) pra "atribuído a {nome}" (Alta).
- Erro silencioso em `ExcecaoCard` → agregação de erro visível.
- Duplicação → `criarResolverInfoProtocolo()`, `criarNomesDaCentralDeRegras()`,
  `shared/ui/carregando.tsx`, `GRUPOS` exportado, rótulos importados, `ehConflito409()`,
  `paraRequestLinhas()`, `MAX_POOL_VISIVEL`/`SEM_EQUIPE` com definição única.
- Componentes grandes → `useAlcadaBuilder` + `AlcadaBuilderCard`; `ListaAlcada`/`AcoesDeStatus`/
  `avisoDeExclusao()`; `RecuperarSenhaPage` em 4 passos + `avaliarRegrasSenha()`;
  `<CelulaAlcance />` + `lib/alcance.ts`.
- If/ternário aninhado → funções com guard clauses e `Record`
  ([codigo-react](patterns/codigo-react.md)).
- Verificado e descartado: contadores de carga, `prazoChip` e o limiar de 4h do filtro não decidem
  regra do back.

## ~2026-09-02 — Continuidade de conferência: histórico no painel de detalhe

Pedido do dono (não é RF): reprovado que reaparece num relatório na mesma etapa volta pro primeiro
conferente (decisão no back). Painel ganhou "HISTÓRICO DE CONFERÊNCIAS" quando há outras linhas
com o mesmo Número; `HistoricoConferencia` e `DetalheProtocolo.historicoConferencias`, sem endpoint
novo. Verificado com spec temporário (importar, reprovar, reimportar; "Regra aplicada: padrão
aberto").

## 2026-09-03 — Frase completa de alçada em Conferentes + `entities/configuracao`

`ConferenteCard`: `prefLabel` ("pode conferir todos os M tipos"/"N de M") + até 3 pills (uma por
`RegraAlcada` aplicável, via `fraseDaRegra`) + "+N regras". `ConferentesBoard` busca regras/tipos/
equipes; `AlcanceDoConferente.equipesPermitidasIds` espelhado. Consequência da tabela `config` do
back: as 2 frases hardcoded de "Operação" em Regras em vigor viraram texto de `useConfiguracao()`
(`entities/configuracao`, só leitura). Verificado com spec temporário (caso real de "+1 regra").

## 2026-09-03 — `Chip` ganha variante `fonte`

`fonte?: 'mono' | 'padrao'` pras pills de equipe/etapa (`ProtocoloCard`, `ExcecaoCard`) —
[ADR-0016](decisions/0016-badges-proprios-e-variante-fonte-no-chip.md). Verificado nos dois temas.

## 2026-09-03 — vitest + lint a sério + pre-commit

[ADR-0011](decisions/0011-adotar-vitest.md) (5 suítes, 40 testes) e
[ADR-0013](decisions/0013-oxlint-por-categorias-e-pre-commit.md) (categorias, 6 regras desligadas,
~20 correções, husky + lint-staged). Verificado: `tsc -b`, build, 40/40, lint 0/0 e
`verify-visual` do `DateTimePicker` (maior risco, pela reestruturação do `calendar.tsx`).

## 2026-09-03 — `prettier-plugin-tailwindcss` + reformat do repo

[ADR-0014](decisions/0014-prettier-com-plugin-tailwind.md). Bundle com o mesmo tamanho gzip antes
e depois (86,85 kB); `verify-visual` em Conferentes e Regras em vigor sem diferença.

## 2026-09-04 — RNF-13 (responsivo < 760px), RF-24g e "N feitos hoje"

- Protótipo navegado em 390px antes (achou o bug de rolagem em "O que cada um alcança hoje").
- Breakpoint e `useIsMobile` ([ADR-0015](decisions/0015-breakpoint-mobile-760.md)); `AppShell`
  mobile; `FilaColunas` com abas; `MAX_POOL_VISIVEL_MOBILE = 8`; alvos de 44px; ajustes em grids,
  tiras de pills, tabelas, `AbaPorStatus`, `DistribuicaoPage`, `BarraDeFiltros`
  ([responsive](patterns/responsive.md)).
- "N feitos hoje": `AbaPorConferente` com `Analista {nível} · {N} feitos hoje`; canto do card
  concluído com `formatDuracaoConcluida(duracao)` (aprovado/reprovado já estava na meta).
- Verificado em 390px e 1280px, dois temas, `scrollWidth <= clientWidth` em cada tela; fluxo real
  criando → concluindo ("· 1 feitos hoje", "324 min"/"0 min"). Mesmas 7 falhas pré-existentes.

## 2026-09-11 — Alçada: filtro/rolagem em Camadas + "equipe não faz etapa" (Motor v4)

- Camadas com busca por `fraseDaRegra` e `max-h-[420px] overflow-y-auto` por camada (uma regra por
  alvo gera 80+ cards).
- Alvo novo: `alvoEhEquipeEEtapa`, `MotivoAlcada 'EquipeEEtapa'`; `fraseDaRegra` checa esse ramo
  **antes** do de etapa (mesma coluna `alvoEtapa`); `setAlvoTipo` trava `permissao: 'Nega'`;
  `camadaDe` espelha o back.
- Bug no back achado pela UI: `GET /regras-alcada` devolvia `alvoEtapa`/`alvoEquipeId` nulos pra
  esse alvo ("fazer undefined de…") — isolado comparando a frase do preview (estado local) com a
  pós-refetch.
- Verificado com cenário próprio via API, dois temas; 42/42 testes.

## 2026-09-11 — Remover/ativar regra de alçada atualiza a lista na hora

(Do commit `b7f3f43`.) Em produção o DELETE persistia, mas a lista só mudava depois de F5 (refetch
lento contra o Render). As mutations passaram a aplicar `setQueryData` no `onSuccess`, além de
invalidar ([dados-e-mutations](patterns/dados-e-mutations.md)).

## 2026-09-11/14 — Seletor de "equipe não faz etapa" redesenhado

- Rodada 1: dois `SeletorMultiplo` (Equipe, Etapa) no lugar de um produto cartesiano cruzado;
  `equipeEEtapaEtapas` no builder, sem valor composto `"::"`; `combosEquipeEEtapa` calculado uma
  vez (preview e criação). N equipes × M etapas = N×M regras.
- Rodada 2: "Quem" trocável gerava frase ambígua — `setAlvoTipo` força `sujeitoTipo: 'nivel'`,
  texto fixo "Por nível (fixo pra este alvo)". (A "equipe" sempre foi a do escrevente.)
- Rodada 3 (2026-09-14, produção): regra criada só pra Júnior não bloqueava Pleno/Sênior. O alvo
  cria a negação pros 3 níveis de uma vez (`NIVEIS_PARA_EQUIPE_E_ETAPA`, `Promise.all`), frase
  "Ninguém confere {etapa} da equipe {nome}", seção "Quem" some. Regras de produção completadas via
  API.
- Cada rodada verificada via Playwright (incluindo inspeção de classe CSS) e por API; 42/42.

## 2026-09-14 — Configuração do sistema (seção 8), nova aba

`AtualizarConfiguracaoRequest` + `features/configuracao/atualizar` (`PUT /config`).
`AbaConfiguracao` (rascunho até "Salvar", validação por campo no cliente espelhando o back), 3
seções / 12 campos com 3 tipos de controle: `dur` (dois steppers h/min + `formatDuracaoCurta`),
`num` (stepper + unidade), `pct` (range nativo + caixa, como o `onRange` do protótipo; fração 0–1
no back, 0–100 no campo); `MiniStepper` local.
Regras em vigor → "Editar operação"; 6ª aba na ordem do protótipo. A primeira versão, feita só pelo
markup, divergia — refeita lado a lado com o protótipo. Verificado: estados, validação cruzada,
persistência lida de volta. 42/42.

## 2026-09-14 — RNF-11 no simulador Testar e em Prazos + resumo "Operação" com 6 itens

"Operação" ganhou correção de resultado (15 min), capacidade estimada (18 min/ato) e descarte
lembrado (30 dias), de `useConfiguracao()`. `AbaAlcadaTestar`: Equipe/Tipo em `SeletorUnico`,
Etapa/Prioridade seguem pills (Prioridade mantida mesmo removida do protótipo —
[ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)). `AbaPrazos`: escreventes sem
equipe em `SeletorUnico` (chips dentro de cada `EquipeCard` continuam pills).

## 2026-09-14 — Modal "Novo protocolo": hora de entrada + scroll do Popover

- Campo "Hora de entrada" (`DateTimePicker`) só na criação, resetado pra "agora" ao abrir; a
  prévia só manda `andamentoEm` na criação.
- Scroll da lista de escreventes dentro do modal: `Popover` dentro de `Dialog` perdia o wheel —
  fix em `shared/ui/popover.tsx` ([shadcn-gotchas](patterns/shadcn-gotchas.md) nº 11). Verificado
  dentro e fora de Dialog.

## 2026-09-14 — Sidebar recolhível (rail de ícones)

(Do commit `39c0ad1`.) Pedido do dono, sem protótipo: `useSidebarStore` (persist por navegador),
rail de 68px com ícones (badge vira ponto, `title` por item), `LogoutButton` com `iconOnly`. Só
desktop.

## 2026-09-14 — Scrollbar customizada, global

Regra em `@layer base` ([design-system](patterns/design-system.md)). Estilo computado conferido nos
dois temas; o headless não pinta a barra — não dado como 100% verificado ([gaps §24](gaps-requisitos.md)).

## 2026-09-15 — Três bugs: observação travada, "data de entrada", DateTimePicker cortado

1. `ObservacaoField` com "Cancelar" e "Salvar observação" separados. Causa raiz: o pool oferecia
   observação antes de pegar o protocolo (sem dono → 403 silencioso); `observacaoSomenteLeitura`
   na coluna Pool.
2. `ProtocoloResumo.andamentoEm` → "entrada DD/MM/AAAA, HH:mm" em `ProtocoloCard` e
   `DistribuicaoProtocoloCard`.
3. `DateTimePicker` com `max-h-[var(--radix-popover-content-available-height)]`, meio rolável e
   rodapé fixo; `onWheel` do popover passou a subir até o ancestral rolável.

Testado ponta a ponta com conferente de teste criado e removido; viewport de 520px. 42/42.

## 2026-09-15 — Loading unificado

[ADR-0018](decisions/0018-loading-com-spinner-unificado.md). Verificado com atraso artificial de
~1,5s, dois temas.

## 2026-09-15 — Auditoria de listagens sem filtro/paginação

Nenhum endpoint pagina. Corrigidos os 4 piores: Regras em vigor (grupo Alçada, ~95+ regras, aba
padrão), histórico do Aprendizado, Exceções (só rolagem — busca duplicada removida), prévia de
Importar (sem o corte fixo de 9). Tipos de ato e Conferentes ficaram como risco moderado/baixo
([ADR-0019](decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md),
[lists-and-long-content](patterns/lists-and-long-content.md)).

## 2026-09-15 — "Atribuir a…"/"Reatribuir a…" no painel de detalhe

`AtribuirManualmente` vale pra Pool, Exceção e Atribuído. `AcoesDeStatus` com seletor inline; no
dia seguinte o `Select` virou `SeletorUnico` (com nível) aqui e no `ExcecaoCard` — o override de
RNF-10 do `SelectTrigger` não foi preservado ([gaps §34](gaps-requisitos.md)). `useAtribuirManualmente`
passou a invalidar o detalhe. Testado: painel atualiza sozinho, busca "mar" filtra.

## 2026-09-15 — "Conferente específico" na criação manual

`SeletorUnico` opcional com "Limpar", só na criação. Sem endpoint novo: cria e, se escolhido,
`AtribuirManualmente` em seguida. Prévia mostra "atribuído direto a <nome>"; `salvando`/
`erroAoSalvar` combinam as duas mutations.

## 2026-09-15 — Uma conta com os dois papéis

Pedido do dono: a distribuidora do cartório (Maria Vittoria, "Vivi") também confere atos às vezes,
na mesma conta. No back, "também é conferente" é derivado de existir um `Conferente` vinculado ao
`UsuarioId` (sem mexer em `Usuario.Papel`, zero migration).

- `Usuario.papel` → `papeis: Papel[]`; `RequireRole` com `some`; home por `papeis[0]`.
- `AppShell`: `itensNavPara(papeis)` — com os dois papéis, "Minha fila" da Distribuidora vira
  "Fila de conferentes" e o "Minha fila" real entra logo depois.
- `DashboardPage.souGestao` por `papeis.includes('Distribuidora')`.
- `VincularExistenteDialog` + `features/conferente/vincular-existente` (`POST /conferentes/vincular`,
  404 e 409 com mensagens próprias).
- **Crash em produção** com sessão persistida antiga → migração versionada
  ([ADR-0017](decisions/0017-sessao-persistida-versionada.md)).
- Papel novo só vale nos endpoints depois de novo login (claims do JWT).
- Card de sessão mostra só o nome.

## 2026-09-15 — Tipos de ato: sem seletor de grupo, com paginação real

Seletor de grupo removido da linha (conceito segue na Matriz/construtor; sem UI pra atribuir grupo
— [gaps §21](gaps-requisitos.md); `features/tipoAto/definir-grupo` fica sem consumidor). Busca +
rolagem pivotou pra paginação de verdade ([ADR-0019](decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md));
gotcha `from "cn"` no `pagination.tsx`. Verificado com 24 tipos (página 2 via rede, cache ao voltar,
busca "venda" → 2 de 24). Regressões de spec corrigidas (rótulo de nav com conta combo; item
criado caindo na página 2; busca atrás do diálogo aberto).

## 2026-09-15 — Prazos por equipe: mover vários escreventes de uma vez

`AbaPrazos`: `selecionadosIds: string[]`, `SeletorMultiplo` pros órfãos, `Promise.all` de mover.
`EquipeCard`: "Mover para cá" se qualquer selecionado não é membro; "Movendo…". Verificado com 2
órfãos reais (2 POSTs), dado revertido.

## 2026-09-15 — `globalSetup` do Playwright

[ADR-0021](decisions/0021-global-setup-garante-contas-de-login.md). `session-isolation.spec.ts`
escopado à sidebar. 21 specs rodados contra o clone anonimizado.

## 2026-09-15 — Cadastro manual de escrevente + a pergunta do "Subscritor"

`NovoEscreventeDialog` (nome + equipe opcional) + `features/escrevente/criar` (`POST /escreventes`),
botão em Prazos por equipe. "Subscritor" investigado e não implementado: não existe no documento de
requisitos; o caminho, se vier, é o mesmo de `Conferente` (entidade com `UsuarioId` opcional, papel
derivado). Verificado: criar sem equipe, duplicado → mensagem.

## 2026-09-15 — Tooltip no chip de prazo

`shared/ui/tooltip.tsx` (gotcha `from "cn"`), `TooltipProvider` com 300ms,
`entities/protocolo/ui/PrazoTooltip.tsx` (primeiro `ui/` da entidade, wrapper fino). Aplicado nos 5
lugares de contagem regressiva; fora de `PassoLinhas` (lá é tipo de prazo, não contagem). Verificado
com hover real nos dois papéis.

## 2026-09-16 — Badge "Alta" também em Minha fila

Não era regressão: nunca implementado ali, e o protótipo não tem. Confirmado com o dono;
`ProtocoloCard`/`EmConferenciaCard` com o mesmo badge; `ListaCompletaPoolSheet` herda.

## 2026-09-16 — "Novo protocolo" com Número já existente

Não era bug (reimportação já assume via continuidade; "Reabrir conferência" reaproveita o
registro). Mudança só de UX: as duas mensagens de "já existe" orientam a abrir o protocolo e usar
"Reabrir conferência". Mudança tentada no back (`PodeRecriar`) revertida.

## 2026-09-17 — Pausar conferência

`ProtocoloResumo.pausadoEm`; `features/minha-fila/{pausar,retomar}-conferencia`. `EmConferenciaCard`:
pausado mostra "Pausado" + "Retomar" (sem Aprovar/Não aprovar — o back exige retomar); ativo mostra
ícone de pausa ao lado do cronômetro. Visibilidade: `DetalheProtocolo.pausas`
(`PausaConferencia`), entrada "Pausado" na timeline e seção "PAUSAS" (`HistoricoDePausas`, resumo
"N pausas · Xmin"). Verificado (conteúdo do Sheet via `innerText`).

## 2026-09-22 — Ajustar duração (distribuidora)

`DetalheProtocolo.duracao`/`ajustesDeDuracao` (`ajustadoPorNome` vem do back — exceção de
[ADR-0006](decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)); `features/protocolo/ajustar-duracao`
(invalida detalhe + `['dashboard']` por prefixo). Painel: linha "Duração", seção "AJUSTES DE
DURAÇÃO", ação "Editar tempo de conferência" (só Aprovado/Reprovado, minutos pré-preenchidos por
`parseDuracaoParaMinutos` + motivo). Verificado incluindo `tempoMedio: "00:45:00"` no `/dashboard`.

## 2026-09-22 — Painel de detalhe: bloco "Histórico" recolhível

`shared/ui/collapsible.tsx` (sem gotcha); `BlocoHistorico` agrupa conferências anteriores, pausas e
ajustes, fechado por padrão, "HISTÓRICO · N". (Reabrir a mesma linha não gera
`HistoricoConferencia`.)

## 2026-09-22 — Estratégia de testes: cobertura com ratchet + RTL

[ADR-0012](decisions/0012-cobertura-com-ratchet-e-rtl.md), [testing-strategy](patterns/testing-strategy.md).
Primeira leva (42 → 60 testes): `progress.test.tsx`, `surface-card.test.tsx`,
`use-filtro-protocolos.test.ts`, `LoginForm.test.tsx`. Skills novas `testing-strategy` e `gate`
(o `dispatch-api` ganhou uma `gate`). Nos commits seguintes do mesmo dia: 6 suítes de lógica pura
(migração de sessão — `migrarSessao` extraída —, regras de senha, resolver de info, frase de
sugestão, `ehConflito409`, nomes da Central), hooks (`useDebouncedValue`, `useIsMobile`, `useNow`,
stores de sidebar/tema), `useAlcadaBuilder`, `SeletorUnico`, `PopoverContent.onWheel`,
`SeletorMultiplo` — ratchet em lines 14,47% · functions 12,35% · branches 11,8% · statements 15%,
132 testes.

## 2026-09-22 — Corte de horário (prazo condicional por Equipe + Etapa)

- `TipoPrazo 'CorteDeHorario'`; `Equipe` com 4 campos `corte{Pre,Pos}ConferenciaHorario{Corte,Vencimento}`
  (`"HH:mm:ss"`); payloads de `features/equipe/{criar,editar}`.
- `shared/ui/stepper.tsx` extraído do `DateTimePicker`; `shared/ui/campo-horario.tsx`.
- `EquipeCard`: `TIPOS_PRAZO` sem `CorteDeHorario`; `BlocoCorte` com "depois de"/"vence às"
  (padrão 16:00/10:00), desligar limpa os dois, commit imediato.
- Rodada 2 (produção): checkbox nativo → `shared/ui/switch.tsx` (gotcha `from "cn"`, `size="sm"`);
  lentidão = falta de feedback + cold start (o recálculo RF-38 não tem N+1) → estado otimista.
  Provado com `PUT` atrasado 2s (texto em <300ms).

## 2026-09-22 — "+N protocolos": fechar o detalhe volta pra lista

`listaCompletaAberta` passou a significar intenção; visibilidade = `&& !detalheAberto` (prop nova
de `DistribuicaoBoard` até `ProtocoloColuna`). `ListaCompletaPoolSheet` não precisou (sem RF-24e).
Verificado com 7 protocolos criados.

## 2026-09-23 — Dashboard: cards de listagem com teto de altura

"Cumprimento de prazo por equipe" e "Por tipo de ato" com a lista em `max-h-[420px]
overflow-y-auto`. Localmente só 4 itens — o estouro não foi visto rodando ([gaps §25](gaps-requisitos.md)).

## 2026-09-25 — Tag de rodada "↻ 2ª conferência" (RF-24k)

Feature 1 do `PLANO-melhorias.md`, lado do front (o back é dispatch-api ADR-0038).
`numeroDaConferencia` em `ProtocoloResumo`/`DetalheProtocolo`/`HistoricoConferencia` (+ `observacao`
no histórico). Novo primitivo `shared/ui/tag.tsx` (`tom: critico | neutro`) e, em
`entities/protocolo/ui/`, `PrioridadeAltaTag` (substitui as 4 cópias inline do "Alta") e
`NumeroConferenciaTag` (variantes `completa`/`media`/`curta`, `title` com o texto completo);
`rotuloNumeroConferencia` em `lib/rotulos.ts`. Onde entra: `ProtocoloCard`, `EmConferenciaCard`,
`DistribuicaoProtocoloCard` (só variante "conferente"), `ListaCompletaColunaSheet`, cabeçalho e
linhas do histórico do `PainelDetalheProtocolo` ("Nª conferência — <observação>" na linha
reprovada).

Verificado: testes de `rotuloNumeroConferencia`, `NumeroConferenciaTag` e `ProtocoloCard` (as duas
pílulas). O ratchet de cobertura, que já falhava no `HEAD`, voltou acima do piso (linhas 15,58%,
funções 13,19%, statements 16,13%, branches 12,78%; pisos reescritos pelo `autoUpdate`). `verify-visual`
com cenário real via API local (importar → reprovar com observação → reimportar → marcar Alta): Minha
fila, Distribuição (coluna estreita) e painel nos dois temas, screenshots lidos; dado de teste apagado
depois. `npm run check` e `npm run build` limpos.

## 2026-09-25 — Aviso de prioridade alta na Minha fila (RF-24h/i/j)

Feature 2 do `PLANO-melhorias.md` (só front). ADR-0023. `useMinhaFila` com `refetchInterval: 30_000`
(pausa em segundo plano) e `IndicadorAtualizacao` ("atualiza sozinha a cada 30s · última há Ns", relógio
próprio). Em `widgets/minha-fila-board`: `lib/prioridade-alta.ts` (`listarAltasPendentes` — do conferente
primeiro, depois pool, por vencimento, sobre a fila sem filtro; `localizar` — aba, lista completa, filtro
escondendo), `lib/alta-vistos.ts` (`diffAltas` + sessionStorage por usuário), `model/use-aviso-prioridade-alta.ts`
(toasts com `useEffectEvent`), `ui/AvisoPrioridadeAlta.tsx` (faixa sticky, até 3 botões ou 2 + "Ver os N"),
`ui/ListaAltasSheet.tsx` (lista das altas com "Pegar" nas do pool). `FilaColunas` aceita aba controlada;
`ProtocoloCard`/`EmConferenciaCard` ganham `data-protocolo-id` e `destacado` (anel com keyframes
`anel-destaque`); `ListaCompletaPoolSheet` recebe `destaqueId`. `MinhaFilaBoard.irPara` faz, em ordem:
limpa o filtro que esconde o card (aviso inline por 7s), troca a aba, abre a lista completa, destaca e rola
(com uma segunda tentativa pro Sheet em portal).

Verificado: testes de `prioridade-alta`, `alta-vistos`, `AvisoPrioridadeAlta`, `useAvisoPrioridadeAlta`
(`vi.mock('sonner')`) e `MinhaFilaBoard` (6º do pool Alta → "Ver" → lista completa aberta, card com anel,
rolagem chamada); fixture `lib/test/protocolo-de-teste.ts` compartilhada (e fora da cobertura, junto com
qualquer `lib/test/`). `verify-visual` contra a API local com a base clonada: faixa com 1 e com 2, "Ver" abrindo
a lista com o card destacado, toast de chegada vindo pelo polling em menos de 40s sem recarregar, F5 sem
repetir o toast, tema escuro, e no celular a faixa presa abaixo da barra — o primeiro screenshot mobile
mostrou o texto espremido sob os botões e a faixa 3,5px sob a barra (corrigido: texto em linha inteira,
`top-[116px]`). Cenário revertido depois (prioridades de volta a Normal, importados apagados). 170 testes;
cobertura 23% de linhas.

## 2026-09-25 — Perfil Administrador, Contas e troca de senha no primeiro acesso

Feature 3 do `PLANO-melhorias.md`, lado do front (back: dispatch-api ADR-0039/0040). ADR-0024, gaps §41.

- **Sessão e rotas**: `Papel` ganha `'Administrador'` (sempre junto de `'Distribuidora'`), `Usuario.trocarSenha`,
  `useEhAdministrador`, `RequireSessaoLiberada` em volta do AppShell, página `/trocar-senha`
  (`features/auth/trocar-senha`, atualiza sessão e cache do `/auth/me`), login e registro do autenticador
  mandando pra lá com a troca pendente. `CamposNovaSenha` e `avaliarRegrasSenha` subiram de
  `pages/recuperar-senha` pra `entities/usuario` (as duas páginas usam).
- **Contas** (`entities/conta`, `features/conta/{criar,desativar}`, `widgets/contas-board`, `pages/contas`):
  lista com "você", "· também confere", papel e situação; `NovaContaDialog` com "Gerar"
  (`gerarSenhaInicial`, `crypto.getRandomValues`); `DesativarContaDialog` com as três travas e "Entendi"
  (antecipadas pela lista, 409 como rede). Item "Contas" e selo "ADMIN" no AppShell.
- **Distribuidora**: `Conferente.nivel` e `DesempenhoConferente.score` viram nullable, com `rotuloAnalista`;
  Conferentes só presença; Dashboard "Produção por conferente"; Central só "Regras em vigor"
  (`lib/alcada-em-vigor.ts` agrupa regra base e trios equipe+etapa); sugestões só pro admin; exceção
  "tipo novo" com "Pedir à administração" desabilitado. Cadastro de conferente com senha inicial 8+ e
  "Gerar".

Verificado: testes de `travaDeDesativacao`, `gerarSenhaInicial`, `itensDeAlcadaEmVigor`,
`NovaContaDialog`, `DesativarContaDialog`, `TrocarSenhaPage`, `RequireSessaoLiberada` e `ConferenteCard`
(as duas visões); 205 testes, cobertura 31,9% de linhas (pisos subiram). Mocks de API nesses testes
são trocados por um `vi.fn()` novo a cada teste: com `mockReset` no `beforeEach`, um erro rejeitado
virava falha do teste no Vitest 5. E2E contra a API local da branch: `contas.spec.ts` novo (criar →
primeiro acesso preso na troca → trocar → desativar; distribuidora sem Contas, Conferentes só presença,
Central só leitura), `conferentes`/`totp-recuperacao-senha`/`central-de-regras`/`alcada-v3` logando
como admin, `dashboard` com um teste pra cada visão. `correcao-reabertura` segue quebrado por motivo
anterior (gaps §28). `verify-visual`: troca de senha, Contas, trava e telas da distribuidora nos dois
temas e no celular, screenshots lidos (quebra de "· também confere" no celular corrigida).

## 2026-09-25 — `correcao-reabertura.spec.ts` volta a passar

Spec de regressão quebrado havia tempo, por três motivos que o tempo acumulou: montava o cenário com
`POST /protocolos/distribuir` (removido do back numa auditoria), procurava o texto "janela de correção
encerrada" (a tela passou a mostrar "resultado já corrigido uma vez" + "Pedir reabertura à
distribuidora") e esperava `Conferindo` depois da reabertura (o back devolve `Atribuido` desde o
ADR-0031). Agora importa o protocolo (`POST /protocolos/importar/confirmar`), acha o id na visão de
distribuição e atribui à mão à conferente de teste (sem alçada, ADR-0027). Verificado: duas rodadas
seguidas passando e a categoria de regressão inteira verde (12 testes).

## 2026-09-25 — Bugs da auditoria visual (Parte 0 do PLANO-dashboard-v2)

Achados comparando o app com o protótipo v2. `shared/ui/sheet.tsx`: a largura padrão das laterais vinha
com o prefixo `data-[side=…]:` e vencia o `w-[…]` de cada tela (o `twMerge` não vê conflito entre
variantes diferentes) — todo painel saía com 384px; agora a largura padrão entra sem o prefixo e cada tela
manda. Login com dois painéis `flex: 1 1 420px` e quebra de linha (protótipo v2). Card de Conferentes com
`flex-wrap` no cabeçalho. Regras em vigor: "definida pela administração" pra distribuidora. Matriz de
alçada: estado vazio e `lib/abreviacao.ts` (iniciais quando o primeiro nome colide).

Verificado: 208 testes; regressão do e2e verde; larguras medidas no navegador (detalhe 432px, lista 480px,
filtros 360px, detalhe no celular 359px); login e Conferentes a 390px sem rolagem lateral.

## 2026-09-25 — Base visual do protótipo v2 (Parte 1 do PLANO-dashboard-v2)

Token `--apoio` (`text-apoio`, o `--muted` do protótipo, só pra texto de apoio — não passa no AA como
conteúdo), `--shadow-sm` com a sombra leve do protótipo, `Button` em 13px/raio 6px com 44px no celular
(`default`/`lg`), e margem de 14px/16px no celular em todas as páginas. Regras em `design-system.md`.
Verificado: 208 testes, build, regressão do e2e, e screenshots de Distribuição/Conferentes/Contas no
desktop e no celular (sem rolagem lateral; botão do diálogo 13px/raio 6px, 14px no celular).
