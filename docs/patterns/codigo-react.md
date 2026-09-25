---
name: codigo-react
description: Padrões de código React/TS que este repo já adotou por causa de bug, lint ou auditoria — Rules of Hooks, estado derivado sem useEffect, dependências de efeito, guard clauses, Record no lugar de ternário, tamanho de componente
metadata:
  type: pattern
  domains: [react, typescript, qualidade, lint]
  status: stable
---

# Código React

> Lint em [ADR-0013](../decisions/0013-oxlint-por-categorias-e-pre-commit.md). Estes padrões saíram
> da auditoria de qualidade de 2026-09-02 e das correções de lint de 2026-09-03.

## Quando recorrer a isto

- Escrever um componente/hook novo ou revisar um diff
- O oxlint reclamou e você quer a correção já usada aqui
- Um componente está grande demais

## Hooks

- **Nunca chame hook depois de um early return.** `DistribuicaoBoard` chamava
  `useFiltroProtocolos` depois do `if (isLoading || !visao) return <Carregando />` — número de hooks
  diferente entre renders. Correção: mover a chamada pra antes do return, com os dados em fallback
  (`visao ? [...] : []`, `?? []`), sem mover o early return.
- **Estado derivado de prop: ajuste durante o render, não em `useEffect(() => setState(prop), [prop])`**
  (recomendação do react.dev; resolveu os 6 `set-state-in-effect`). Usado em `EquipeCard`,
  `TipoAtoRow`, `FilaConferentesPage`, `DateTimePicker`/`Stepper` e no estado otimista do
  `BlocoCorte`.
- **Dependências de efeito completas**: o `useEffect` que pré-preenche o modal de edição não tinha
  `escreventes` nas deps, então nunca recalculava quando a lista chegava (`!!escreventes` entrou na
  lista).
- Função `criarX()` sem `use` quando não chama React por dentro (`criarResolverInfoProtocolo`,
  `criarNomesDaCentralDeRegras`) — não é hook.

## Condicionais

- **If/ternário aninhado → função nomeada com guard clauses** fora do componente
  (`mensagemDeErro()`, `avisoDeExclusao()`), em vez de IIFE ou ternário dentro de template string.
- **Ternário de N ramos → `Record<Chave, Valor>`** (`Record<Passo, boolean>`, `Record<Passo, string>`,
  `ESTADO_GRUPO`/`ESTADO_TIPO` em `lib/alcance.ts`). Espaços de estado diferentes ganham `Record`s
  separados, não um union forçado.
- Uma variável de status + lookup em vez de dois ternários paralelos checando a mesma condição
  (`<CelulaAlcance />`).
- Oxlint `no-negated-condition`: inverta o ternário pra tirar a negação do topo.

## Tamanho e responsabilidade

- Extraia quando há **mistura de responsabilidades**, não por contagem de linhas: estado de builder
  → hook (`useAlcadaBuilder`, `AbaAlcada.tsx` 308 → ~95 linhas); bloco de ações com mutations →
  subcomponente dono das próprias mutations (`<AcoesDeStatus />`); wizard → um arquivo por passo
  (`PassoIdentificacao`/`PassoCodigo`/`PassoSenha`/`PassoOk`, seguindo `importar-lote-wizard`).
- Subcomponentes pequenos podem morar no mesmo arquivo (`<ListaAlcada />`, `BlocoHistorico`).
- Regra compartilhada entre shell e passo vira função em `lib/` (`avaliarRegrasSenha()`).
- Constante usada em dois widgets vai pra `lib/constantes.ts` do dono, reexportada no barrel
  (`MAX_POOL_VISIVEL`); sentinela com comentário de requisito fica numa definição única
  (`SEM_EQUIPE`, RF-29a).
- Réplica local de classificação do back **só pra agrupar leitura** é aceitável se espelhar
  exatamente (`camadaDe` ↔ `ResolvedorAlcada.CamadaDe`) — nunca pra decidir.

## Correções de lint já usadas

- `only-export-components`: `buttonVariants` foi pra `button-variants.ts`.
- `jsx-no-useless-fragment`: `<>{children}</>` → `children` (componente pode devolver `ReactNode`).
- `eqeqeq`: `!=` → `!==` quando o campo é `string | null` sem `undefined`.
- `no-unescaped-entities`: aspas em JSX → `&quot;`.
- `no-promise-executor-return`: `setTimeout` entre chaves no executor.
- `no-shadow` + `no-unstable-nested-components`: componentes de slot em escopo de módulo; disable
  pontual comentado só onde a extração seria desproporcional.

## Referências

- [dados-e-mutations](dados-e-mutations.md), [tailwind](tailwind.md)
