---
name: dados-e-mutations
description: Padrões de TanStack Query, cliente HTTP e formulários neste repo — queryKey, enabled, invalidação (e o que já faltou), cache por sessão, erros 401/404/409, UI otimista, commit no blur, validação espelhada
metadata:
  type: pattern
  domains: [dados, tanstack-query, http, formularios]
  status: stable
---

# Dados, mutations e formulários

> TanStack Query **é** a camada de acesso a dados ([ADR-0001](../decisions/0001-adotar-feature-sliced-design.md)).
> Scaffold de slices: skills `new-entity` (leitura) e `new-feature` (escrita).

## Quando recorrer a isto

- Criar/alterar um hook de query ou mutation
- A tela não atualiza depois de uma ação, ou mostra dado de outro usuário
- Tratar erro de API num formulário/diálogo
- Um controle parece "lento" depois do clique

## Queries

- `queryKey` descritiva e com o id embutido quando o dado é por recurso
  (`['conferentes', id, 'fila']`) — cada conferente com seu cache, nunca uma query só trocando de
  dono por baixo. Parâmetros de paginação/busca entram na chave.
- **`options?: { enabled?: boolean }`** nos hooks de `entities/*` que podem ser montados sem
  precisar do dado. Casos: badges do menu não disparam pra Conferente (endpoints só
  Distribuidora); `PainelDetalheProtocolo` fica **sempre montado** (desmontar cortaria a animação
  de saída do Radix), então suas 6 queries usam `enabled: !!protocoloId`.
- Hooks repetidos com a mesma `queryKey` em componentes diferentes **são deduplicados** pelo
  TanStack Query — não é over-fetching (`useVisaoDistribuicao`, `usePedidosReaberturaPendentes`,
  `useSugestoesPendentes`).
- Não busque subconjunto trivial com GET próprio: `escreventes.filter(e => !e.equipeId)` substituiu
  `GET /escreventes/sem-equipe` (removido o hook, a key e as invalidações dela).
- Telas com abas montam só a aba ativa (mount condicional) — cada aba busca o que usa.
- `placeholderData: (anterior) => anterior` mantém a página anterior enquanto a próxima carrega.

## Mutations e invalidação

- `onSuccess` invalida **toda** `queryKey` afetada — inclusive a do detalhe aberto e caches
  auxiliares. Faltas que já viraram bug:
  - `useAtribuirManualmente` só invalidava a visão de Distribuição; usado de dentro do painel de
    detalhe, o painel mostrava o dono antigo → passou a invalidar `DETALHE_PROTOCOLO_QUERY_KEY(id)`
    (achado comparando com `useDevolverAoPool`).
  - `useCriarProtocoloManual`/`useEditarProtocoloManual` não invalidavam `ESCREVENTES_QUERY_KEY`
    — escrevente criado junto (RF-09) ficava fora do cache (`staleTime` 60s).
  - `marcar-presenca`/`remover` conferente invalidam `VISAO_DISTRIBUICAO_QUERY_KEY` além de
    `CONFERENTES_QUERY_KEY` (RF-27 devolve protocolos ao pool).
  - `ajustar-duracao` invalida `['dashboard']` **por prefixo** — a mutation não sabe qual período
    está aberto.
- **Quando o refetch pode não chegar a tempo, escreva no cache**: remover/ativar regra de alçada
  parecia não funcionar em produção (refetch em background lento contra o Render). Hoje
  `onSuccess` aplica a mudança com `queryClient.setQueryData` **e** invalida por trás.
- Ação que o domínio não tem em lote vira `Promise.all` de `mutateAsync` (uma regra por alvo;
  mover N escreventes; 3 níveis de "equipe não faz etapa"). Limpe a seleção só depois de todos
  resolverem; combine `isPending`/erro das mutations encadeadas (criar + atribuir) no botão.
- Não ofereça na UI ação que o servidor vai rejeitar (fila de outro conferente é só leitura;
  observação só pra quem é dono — um "Salvar" no pool voltava 403 silencioso).

## Sessão e cache

- `queryClient.clear()` no logout, no login e no handler de 401 — o cache não tem escopo por
  usuário (vazou sessão entre logins em 2026-08-27; regressão em `e2e/session-isolation.spec.ts`).
- O `httpClient` trata **qualquer 401** como sessão encerrada (`onUnauthorized`). Endpoint anônimo
  cujo 401 é resultado de negócio ("código errado") passa
  `{ ignorarSessaoEncerrada: true }` no `AxiosRequestConfig` (hoje só
  `recuperar/validar-codigo` e `recuperar/redefinir-senha`) — senão derrubaria a sessão de outra
  aba.
- Papel novo numa conta logada: `/auth/me` atualiza o menu, mas o **JWT** mantém as claims antigas
  até novo login (mesma natureza do RF-01k, troca de senha invalidando sessões) — peça pra
  deslogar/logar.

## Erros em formulários

- `isAxiosError(e) && e.response?.status === 409` → `ehConflito409(error)`
  (`shared/lib/conflito-409.ts`) pra duplicidade (e-mail, nome de tipo/escrevente). Quando há mais
  de um erro esperado (404 "nenhuma conta com esse e-mail" + 409 "já é conferente" em
  `VincularExistenteDialog`), trate cada status com mensagem própria.
- Erro de ação num card nunca é silencioso: agregue (`atribuir.error ?? descartar.error`) e mostre.
- 409 "em uso" inline embaixo da linha (`text-bad-fg`), mesma convenção dos diálogos.
- Mensagem de "já existe" **orienta pra ação certa** ("abra-o e use 'Reabrir conferência'"), não só
  trava.
- **Validação espelhada no cliente** quando o back devolve um motivo só por vez
  (`ValorInvalido(string)`, tela de Configuração): o cliente valida por campo (mesmas regras,
  incluindo a cruzada); um 400 inesperado vira aviso geral no topo. Regras de senha também são
  replicadas pra feedback ao vivo — o back segue sendo a fonte.
- Não extraia abstração demais: de todo o boilerplate de diálogo só `ehConflito409` era idêntico;
  reset-ao-abrir e campos continuam em cada diálogo.

## Edição e feedback

- **Commit no blur** pra texto que dispara recálculo caro no back (nome de equipe: cada
  `PUT /equipes/{id}` recalcula vencimentos, RF-38; nome de tipo de ato). Pills/steppers commitam
  no clique.
- **Rascunho local + "Salvar"** quando o endpoint não faz PATCH parcial (Configuração, 12 campos
  juntos; `PUT /equipes` sempre com o objeto inteiro).
- **UI otimista local** quando o round-trip é perceptível (toggle de corte de horário, cold start
  do Render/Neon free): mostra o valor na hora e descarta o otimista quando o dado real alcança o
  exibido — padrão "ajusta estado durante o render" ([codigo-react](codigo-react.md)), sem sistema
  de rollback genérico.
- Estado de pendência no botão ("Movendo…", "Redistribuindo…" com `Loader2Icon`), sem aceitar
  duplo clique.
- Excluir com desfazer: toast do `sonner` com `action: { label: 'Desfazer', onClick }`,
  `duration: 8000` (soft-delete no back).

## Testes

TanStack Query v5 passa um 2º argumento pra toda `mutationFn` (`{ client, meta, mutationKey }`) —
afirme `mock.calls[0][0]`, não `toHaveBeenCalledWith(payload)`. Ver [testing-strategy](testing-strategy.md).

## Referências

- `shared/api/http-client.ts`, `shared/lib/query-client.ts`, `shared/lib/conflito-409.ts`
- [ADR-0002](../decisions/0002-sessao-sem-decodificar-jwt.md), [ADR-0006](../decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)
