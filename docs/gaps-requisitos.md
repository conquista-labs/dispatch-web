# Gaps em relação aos requisitos — dispatch-web

**Fonte de verdade**: `../dispatch-prototype/Dispatch - Requisitos.dc.html` (RF/RNF) e o protótipo
aprovado (`Dispatch v2.dc.html`).
**Aberto em**: 2026-09-25, consolidando o que o antigo `CLAUDE.md` registrava como "gap", "fica pra
depois", "fora de escopo", "simplificação consciente" e "divergência".

---

## Como ler

- **A numeração (§N) é estável.** Item fechado não é apagado nem renumerado — muda de situação e
  ganha "onde foi fechado". Item novo entra no fim. Cite `§N` em comentário de código ou commit.
- **"Como sabemos"** diz a evidência: comentário no código, verificação feita, leitura do requisito.
  Onde não verificamos, está dito.
- **Divergência deliberada do protótipo não é gap** — está no
  [ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md). Aqui entram só as que deixam
  um requisito sem cobertura.

| Marca | Significa                                                                      |
| ----- | ------------------------------------------------------------------------------ |
| 🔴    | Em aberto                                                                      |
| ✅    | Fechado (com onde)                                                             |
| ⚪    | Fechado sem mudança: decidido conviver, ou decisão de produto                  |
| 🔍    | Pendência de verificação (código existe, não foi visto funcionando de verdade) |

## Índice por situação

| Situação       | Itens                                                                                                                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 Aberto      | §1 .csv/.xlsx · §2 RF-24e · §3 RF-34c · §7 casos concretos · §16 tipo de ato livre no manual · §19 tema antes do login · §20 tema por usuário · §21 atribuir grupo · §22 busca em Conferentes · §27 rótulos de exceção · §28 cenários e2e manuais · §34 RNF-10 no `SeletorUnico` |
| 🔍 Verificação | §24 scrollbar · §25 teto do Dashboard                                                                                                                                                                                                                                            |
| ✅ Fechado     | §5 · §6 · §10 · §11 · §12 · §13 · §14 · §15 · §17 · §18 · §30 · §31 · §32 · §33 · §35 · §36 · §39 · §40 · §41                                                                                                                                                                    |
| ⚪ Sem mudança | §4 RF-01m/n · §8 KPIs mock · §9 SAÍDAS · §23 paginação no back · §26 ícone em botões · §29 alçada por item · §37 Subscritor · §38 CI                                                                                                                                             |

**Não auditado**: este levantamento só cobre o que o histórico registrou. Requisitos que nunca
foram citados nele (ex.: RF-44 "Exportar CSV", RF-42a "Hoje, agora") não foram conferidos contra o
código — confira antes de assumir que estão prontos ou faltando.

---

## Detalhamento

### §1 🔴 RF-05/RF-06 — importar arquivo `.csv`/`.xlsx`

- **Falta**: só colar linhas está implementado; não há upload de arquivo nem parsing de planilha.
- **Como sabemos**: comentários em `widgets/importar-lote-wizard/ui/PassoDados.tsx` ("arquivo de
  verdade (.csv/.xlsx) fica pra depois") e `shared/lib/parse-csv.ts` (parser mínimo, sem campo com
  vírgula). Mesma pendência documentada no back.
- **Onde entraria**: `PassoDados` (input de arquivo) + uma lib de planilha, ou o back aceitar o
  arquivo.

### §2 🔴 RF-24e — clicar no card de Minha fila abre o painel de detalhe

- **Falta**: nenhuma coluna de Minha fila (nem concluídos) abre o `PainelDetalheProtocolo`.
- **Como sabemos**: registrado em 2026-09-01 ("Concluídos hoje") e reconfirmado em 2026-09-22 (o fix
  do "+N" não precisou ser replicado em `ListaCompletaPoolSheet` por isso).
- **Onde entraria**: wire-up do painel em `widgets/minha-fila-board` e `fila-do-conferente-board`,
  com `stopPropagation` nos botões internos (pegar, iniciar, aprovar, observação); depois,
  replicar o padrão "fechar o detalhe volta pra lista" no `ListaCompletaPoolSheet`.

### §3 🔴 RF-34c — mesclar dois tipos de ato

- **Falta**: a ação de mesclar (migrar `Protocolo`/`RegraAlcada` pro tipo que fica, registrar no
  histórico de aprendizado).
- **Como sabemos**: deixado de fora explicitamente em 2026-08-28 ("maior que as ações já
  construídas").
- **Onde entraria**: caso de uso novo no back + ação em `AbaTiposDeAto`/`TipoAtoRow`.

### §4 ⚪ RF-01m / RF-01n — liberação sem autenticador e códigos de recuperação do admin

- **Situação**: fora de escopo por decisão explícita do dono; nem o link "Não tenho o app" do
  protótipo foi construído. O próprio requisito marca "ainda não construídos".
- **Onde entraria**: telas públicas de TOTP/recuperação + endpoints no back.

### §5 ✅ RF-43 — cumprimento de prazo por equipe e etapa no Dashboard

- **Fechado em** 2026-09-01 (`VisaoGestao.tsx`, consumindo `cumprimentoPrazoEquipe`). O título da
  entrega dizia "metade do gap" — a outra metade era o lado do back.

### §6 ✅ RF-39 — índice de confiança da sugestão

- **Fechado em** 2026-08-31 (`AbaAprendizado`, barra + percentual). Antes era simplificação
  consciente (o back não calculava score).

### §7 🔴 Chips de "casos concretos" nos cards de sugestão

- **Falta**: os exemplos específicos que o protótipo mostra por sugestão.
- **Como sabemos**: `Sugestao` só carrega evidência agregada (texto) e contagem, nunca uma lista de
  exemplos — registrado em 2026-08-28 e 2026-08-31.
- **Onde entraria**: back expor exemplos na sugestão; `AbaAprendizado` renderizar.

### §8 ⚪ KPIs mockados do Aprendizado ("5.724 linhas lidas", "96% classificadas sem você")

- **Decisão**: trocados por métricas derivadas de dado real (tipos no catálogo, regras em vigor,
  propostas na fila, aplicadas até hoje) — não inventar dado
  ([ADR-0006](decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)).

### §9 ⚪ Seção "SAÍDAS" do simulador Testar

- **Decisão**: não existe — o back não calcula sugestões de ajuste. Entraria se o back passar a
  calcular.

### §10 ✅ "N feitos hoje" no card de conferente + tempo de conferência no card concluído

- **Fechado em** 2026-09-04 (`AbaPorConferente`, `DistribuicaoProtocoloCard`), depois de o back
  expor `ConcluidoEm`/`Duracao`/`ConcluidosHojePorConferente`.

### §11 ✅ Linha de tipo de ato nos cards

- **Fechado em** 2026-09-01: RF-14 no card de Distribuição (`resolverInfoProtocolo`) e depois no
  `ProtocoloCard` de Minha fila (o protótipo v2 passou a mostrar); em "Concluídos hoje" no mesmo dia.

### §12 ✅ Nome de escrevente/equipe e badge "Alta" no card de Distribuição

- **Fechado em** 2026-09-01 (prioridade manual + RF-14; badge corrigido pra "Alta" na linha da meta).

### §13 ✅ Frase de alçada por conferente (Conferentes)

- **Fechado em** 2026-09-03 (`prefLabel` + até 3 pills + "+N regras").

### §14 ✅ Pills de equipe/etapa com a fonte do protótipo

- **Fechado em** 2026-09-03 (variante `fonte` do `Chip`,
  [ADR-0016](decisions/0016-badges-proprios-e-variante-fonte-no-chip.md)).

### §15 ✅ Prioridade com 3 níveis

- **Fechado em** 2026-09-02 (`'Baixa' | 'Normal' | 'Alta'`, rótulo "Média" pra Normal).

### §16 🔴 Tipo de ato com nome livre no protocolo manual

- **Falta**: o protótipo deixa digitar um tipo fora da lista ("entra como novo e cai em exceções");
  o app só aceita tipos cadastrados.
- **Como sabemos**: `CriarProtocoloManual`/`EditarProtocoloManual`/`SimularProtocoloManual` só
  aceitam `tipoAtoId`; o "tipo desconhecido" só nasce via `ImportarLote`. O modal diz isso ao
  usuário ("só tipos já cadastrados").
- **Onde entraria**: mudança de arquitetura no back (resolver tipo por nome, como
  `ResolvedorDeEscreventePorNome`), depois `SeletorUnico.permiteValorLivre` no campo.

### §17 ✅ Resumo "Operação" com a correção de resultado (RF-24a)

- **Fechado em** 2026-09-14 (6 itens derivados de `useConfiguracao()`).

### §18 ✅ Configuração do sistema editável (seção 8)

- **Fechado em** 2026-09-14 (aba Configuração). Antes o `PUT /config` só era usável via curl/Swagger.

### §19 🔴 RF-04 — alternador de tema antes do login

- **Falta**: o requisito pede o alternador "disponível antes e depois do login"; `/login`, TOTP e
  recuperação de senha não têm toggle (seguem o tema persistido ou `prefers-color-scheme`).
- **Como sabemos**: investigado em 2026-09-01 — `useThemeStore` só é consumido no `AppShell` e no
  `sonner`. Decidido não pôr toggle só nas telas novas (inconsistente sem o login).
- **Onde entraria**: um controle de tema compartilhado pelas telas públicas (login incluído).

### §20 🔴 RF-04 — persistência "por usuário"

- **Falta**: a preferência é por navegador (localStorage), não sincronizada entre dispositivos.
- **Como sabemos**: o `Usuario` do back não tem campo de preferência de tema (registrado desde
  2026-08-27).
- **Onde entraria**: campo no back + ler/gravar no `theme-store`.

### §21 🔴 Atribuir grupo a um tipo de ato

- **Falta**: desde 2026-09-15 não há nenhum lugar na UI pra definir o grupo de um tipo (removido da
  linha, nunca existiu no diálogo de criação). Tipos que já têm grupo seguem funcionando na Matriz e
  nas frases.
- **Como sabemos**: efeito colateral registrado na entrega; `features/tipoAto/definir-grupo/` está
  sem consumidor.
- **Onde entraria**: campo de grupo em `NovoTipoAtoDialog` ou num diálogo de editar tipo.

### §22 🔴 Conferentes sem busca/filtro (Tipos de ato: ✅)

- **Falta**: a lista de Conferentes não tem busca.
- **Como sabemos**: auditoria de 2026-09-15 classificou como "risco moderado/baixo hoje". Tipos de
  ato foi resolvido com paginação real no mesmo dia.
- **Onde entraria**: padrão de [lists-and-long-content](patterns/lists-and-long-content.md).

### §23 ⚪ Paginação no servidor fora de Tipos de ato

- **Decisão**: mitigação client-side até o volume justificar
  ([ADR-0019](decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md)).

### §24 🔍 Scrollbar customizada não vista em navegador real

- **Pendência**: estilo computado confere nos dois temas, mas o screenshot headless não pinta a
  barra. Conferir numa sessão local de verdade antes de considerar fechado.

### §25 🔍 Teto de altura dos cards do Dashboard não visto estourando

- **Pendência**: localmente só havia 4 itens por lista (abaixo de 420px). Olhar quando produção
  tiver volume.

### §26 ⚪ Botões de ação com texto de pendência sem ícone

- **Decisão**: os ~30 "Salvando…"/"Criando…" ficaram fora do loading unificado
  ([ADR-0018](decisions/0018-loading-com-spinner-unificado.md)).

### §27 🔴 Rótulos de exceção "sem alçada" vs. "barrado por regra"

- **Falta**: o protótipo distingue os dois; o app mostra "tipo novo" ou "sem alçada".
- **Como sabemos**: o back não distingue "escala vazia" de "barrado por regra" em `motivoExcecao`
  (registrado em 2026-08-27, `tagDaExcecao`).
- **Onde entraria**: back diferenciar o motivo; `ExcecaoCard` mapear.

### §28 🔴 Specs de verificação visual pontual dependem de cenário manual

- **Falta**: `minha-fila`, `distribuicao`, `importar`, `central-de-regras`, `distribuicao-v2`,
  `dashboard` (visão conferente), `painel-detalhe-protocolo`, `alcada-v3` falham sem re-semear.
- **Como sabemos**: decisão de custo/benefício ([ADR-0020](decisions/0020-playwright-com-duas-categorias-de-spec.md));
  confirmado contra o clone de produção em 2026-09-15.
- **Onde entraria**: cada spec criar e apagar o próprio cenário via API.

### §29 ⚪ RF-18c — "quantos têm alçada" por item da lista completa

- **Decisão**: simplificação consciente — exigiria repositórios novos em `ObterVisaoDistribuicao`, e
  a informação está um clique adiante no painel de detalhe (mais rica que uma contagem).

### §30 ✅ RNF-13 — responsivo abaixo de 760px

- **Fechado em** 2026-09-04 ([responsive](patterns/responsive.md)). A skill `verify-visual` ainda
  dizia "não é requisito formal" — corrigido em 2026-09-25.

### §31 ✅ RF-24g — Minha fila em abas no mobile, 8 itens, alvos de 44px

- **Fechado em** 2026-09-04.

### §32 ✅ RNF-11 — seletor com busca em listas que crescem

- **Fechado** em etapas: construtor de regra (2026-09-01), simulador Testar e escreventes sem equipe
  (2026-09-14), seletores de conferente (2026-09-15). Pills continuam de propósito em conjuntos
  pequenos e fixos (etapa, prioridade, chips dentro de cada equipe).

### §33 ✅ RNF-10 — nome de registro não trunca

- **Fechado em** 2026-08-31 (16 ocorrências). Exceção deliberada: a linha de meta do card de
  Distribuição ([ADR-0010](decisions/0010-divergencias-deliberadas-do-prototipo.md)). Resíduo em §34.

### §34 🔴 RNF-10 residual — `SeletorUnico` trunca o nome do conferente

- **Falta**: desde 2026-09-15 os seletores de conferente do painel de detalhe e do `ExcecaoCard`
  usam `SeletorUnico`, que trunca por padrão; o override de RNF-10 do antigo `SelectTrigger` não
  foi preservado (escolha por consistência com os demais seletores).
- **Como sabemos**: registrado na entrega "Atribuir a…".
- **Onde entraria**: modo "quebra linha" no `SeletorUnico` (trigger e itens), se o dono considerar
  que escolher conferente é "distinguir registros parecidos".

### §35 ✅ RF-18i — excluir protocolo

- **Fechado em** 2026-09-01 (protocolo manual: excluir com desfazer). Mais cedo no mesmo dia, dado
  de teste do Dashboard ficou no banco local por falta dele.

### §36 ✅ RF-24a-d — correção de resultado e pedido de reabertura

- **Fechado em** 2026-08-31.

### §37 ⚪ Papel "Subscritor"

- **Situação**: não existe no documento de requisitos — só como comentário-âncora em
  `entities/usuario/model/types.ts`, `role-home-route.ts` e `app/routing/require-role.tsx`. O dono
  decide quando prototipar. Caminho, se vier: mesmo padrão de `Conferente` (entidade com `UsuarioId`
  opcional, papel derivado como `PapeisEfetivos`); `Escrevente` hoje não tem `UsuarioId`.

### §38 ⚪ CI e testes no pre-commit

- **Decisão**: sem CI; `vitest` fora do `lint-staged`; deploy manual
  ([ADR-0011](decisions/0011-adotar-vitest.md), [ADR-0022](decisions/0022-deploy-manual-no-netlify-com-build-remoto.md)).

### §39 ✅ RF-24k — tag de rodada ("↻ 2ª conferência")

- **Fechado em 2026-09-25**: `NumeroConferenciaTag` nos cards de Minha fila e Em conferência, na
  coluna estreita de Distribuição → Por conferente ("↻ 2ª"), na lista completa da coluna e no
  cabeçalho do detalhe; cada linha do histórico mostra "Nª conferência — <observação>" quando foi
  reprovada. O número vem do back (`numeroDaConferencia`, dispatch-api ADR-0038).
- **Diverge de**: o motivo da não aprovação é a observação da linha reprovada, não um campo próprio
  (decisão do dono); a tag não aparece em Distribuição → Por status nem em Concluídos hoje (igual ao
  protótipo).

### §40 ✅ RF-24h/i/j — aviso de prioridade alta na Minha fila

- **Fechado em 2026-09-25** ([ADR-0023](decisions/0023-aviso-de-prioridade-alta-com-polling-e-sessionstorage.md)):
  faixa presa no topo (até 3 botões; com 4+, os 2 primeiros + "Ver os N" → `ListaAltasSheet`), toast
  de chegada (um por protocolo; vários → um resumo; nada na primeira carga; nunca repete na sessão),
  fila se atualizando a cada 30s com "última há Ns", e "Ver" levando ao card (limpa filtro com aviso,
  troca a aba no celular, abre a lista completa, anel por ~4s).
- **Diverge de**: RF-24j fala em 5 cards "por coluna" — aqui só o pool corta; memória em
  `sessionStorage` em vez de memória de tela (ADR-0010).

### §41 ✅ Perfil Administrador, Contas e troca de senha (§3, RF-29a, RF-30a, RF-43a, RF-44 a 48)

- **Fechado em 2026-09-25** ([ADR-0024](decisions/0024-perfil-administrador-no-front.md)): tela
  Contas (lista, criar com "Gerar", desativar com as travas e o "Entendi"), selo "ADMIN" na sessão,
  `/trocar-senha` obrigatória no primeiro acesso (também pra conferente novo). Pra distribuidora:
  Conferentes só presença, Central só "Regras em vigor" (regra base agrupada, "só a administração
  edita"), Dashboard "Produção por conferente" em ordem alfabética, sem selo de sugestões, exceção
  "tipo novo" com "Pedir à administração" desabilitado.
- **Diverge de**: RF-03 (o admin também cai no Dashboard — decisão do dono); correções de texto do
  protótipo em ADR-0010. Fora: reativar conta e trocar papel.
