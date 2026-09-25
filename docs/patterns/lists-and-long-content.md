---
name: lists-and-long-content
description: Como tratar listas que crescem e nomes longos — busca + rolagem contida, "+N protocolos", paginação, e o padrão de quebra de linha do RNF-10 (e onde ele não se aplica)
metadata:
  type: pattern
  domains: [ui, listas, rnf-10, rnf-11]
  status: stable
---

# Listas longas e conteúdo longo

> Decisão de escopo em [ADR-0019](../decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md).

## Quando recorrer a isto

- Lista, card ou coluna que cresce com o cartório (regras, histórico, exceções, tipos, equipes)
- Nome de registro ao lado de outros campos de uma linha
- Escolher entre truncar, rolar, "+N" ou paginar

## Busca + rolagem contida (o padrão)

Usado em Alçada → Camadas, Regras em vigor (grupo Alçada), Aprendizado (histórico), Importar
(prévia), Dashboard (cumprimento por equipe / por tipo de ato):

- `Input` de busca filtrando por um texto derivado (ex.: `fraseDaRegra(regra).toLowerCase().includes(busca)`)
  ou, pra RNF-11, busca que ignora acento (normalização NFD, igual `Combo.dc.html`).
- **Só a lista** num `div` com `max-h-[420px] overflow-y-auto` (título/subtítulo do card fixos).
  Valores em uso: 420 (Camadas, Regras em vigor, Aprendizado, Dashboard), 480 (prévia de
  importação), 560 (Exceções; Tipos de ato na 1ª versão).
- Contador **"N de M"** quando a busca reduz; contadores de cabeçalho continuam mostrando o total
  real, não o filtrado.
- Mensagens distintas: "nenhuma decisão ainda" vs. "nenhuma bate com a busca".
- Busca que só aparece acima de um limiar (prévia de importação: > 9 linhas).
- Grupos limitados pelo domínio (Prazo, Catálogo, Operação em Regras em vigor) **não** precisam de
  busca — `GrupoVigor.totalSemFiltro?` existe só pro grupo que usa.

**Não duplique filtro**: a aba Exceções já recebe `visaoFiltrada.excecoes`, filtrada pelo
`BarraDeFiltros` do board pai — uma segunda caixa de busca ali seria pior UX (removida antes do
commit). Ficou só a rolagem.

**Não esconda o que exige ação**: exceções não truncam com "+N" (cada uma pede resolução ativa);
só colunas de consulta truncam.

## "+N protocolos" (RF-18c)

- Colunas de protocolo mostram 5 (desktop) / 8 (mobile, pool de Minha fila) e um `<button>`
  "+N protocolos" que abre um `Sheet` com **todos** os itens da coluna, ordenados por vencimento
  (`ListaCompletaColunaSheet` em Distribuição, `ListaCompletaPoolSheet` em Minha fila —
  reaproveitando o card da própria tela, com `onAcao` ou `somenteLeitura`).
- **Abrir o detalhe a partir da lista não fecha a lista.** O estado local
  `listaCompletaAberta` significa "o usuário quer ver a lista"; a visibilidade real do Sheet é
  `listaCompletaAberta && !detalheAberto` (`detalheAberto` desce de `DistribuicaoBoard`). Fechar o
  painel de detalhe devolve pra lista, com a mesma rolagem, sem round-trip.

## Paginação no servidor (só Tipos de ato)

`queryKey` com os parâmetros, `placeholderData: (anterior) => anterior` (sem piscar loading na
troca de página), `useDebouncedValue(busca, 300)`, busca reseta `pagina` pra 1, só
Anterior/Próxima. Filtro client-side não precisa de debounce (síncrono sobre array em memória).

## RNF-10 — nome de registro não trunca

> _"Nenhum nome de registro pode ser truncado em tela cuja função é distinguir registros parecidos
> (catálogo de tipos, lista de escreventes): o nome quebra em linha."_

- **Não corte dado**: nada de `.split(' ')[0]` (primeiro nome só = colisão garantida entre
  homônimos).
- **Troque `truncate`/`line-clamp-1` por quebra normal** (`text-pretty`).
- **Padrão de alinhamento** em linha/card com nome ao lado de campos de 1 linha (contagem, badge,
  chip): `items-center` → `items-start` no container, e compense os vizinhos com
  `mt-0.5`/`mt-1`/`mt-px` pra alinharem com a primeira linha do nome. Não é troca mecânica: cada
  layout pede o offset certo (referência: `AbaAlcada.tsx`, `PassoLinhas.tsx`).
- Override local quando o primitivo compartilhado trunca (`SelectTrigger`: ver
  [tailwind](tailwind.md) sobre o modificador `data-[size=default]:h-auto`).

**Onde RNF-10 não se aplica** (decisão registrada, [ADR-0010](../decisions/0010-divergencias-deliberadas-do-prototipo.md)):
a linha "escrevente · equipe · etapa" do card de Distribuição (e do item da lista completa) é dado
auxiliar num card operacional (RF-13), não lista de desambiguação — trunca como o protótipo
(`overflow-hidden text-ellipsis whitespace-nowrap`) com `title` mostrando o texto completo.
Em Minha fila o escrevente **não** trunca (linha própria, equipe/etapa são pills separadas).

Pendência: `SeletorUnico` trunca por padrão, e desde 2026-09-15 os seletores de conferente
(painel de detalhe, `ExcecaoCard`) usam ele — ver [gaps §34](../gaps-requisitos.md).

## Referências

- [responsive](responsive.md), [design-system](design-system.md)
