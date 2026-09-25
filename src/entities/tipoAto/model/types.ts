// Espelha TipoAtoResponse (Dispatch.Api/Endpoints/TipoAtoEndpoints.cs).
export type TipoAto = {
  id: string
  nome: string
  ativo: boolean
  grupo: GrupoTipoAto | null
  // Peso de complexidade decimal (0,50–2,50) — RF-18a, mostrado no painel de detalhe. Opcional: a
  // API anterior à fatia 5 do Dashboard v2 não manda no GET /tipos-ato.
  pesoComplexidade?: number
}

// Tempo de referência efetivo de um tipo (RF-46c): o informado pelo admin, senão a mediana do
// histórico (12 meses, ≥30 conferências), senão a estimativa "tempo médio por ato × peso".
export type OrigemTempoReferencia = 'Informado' | 'Historico' | 'Estimado'
export type TempoReferencia = {
  minutos: number
  origem: OrigemTempoReferencia
  informadoMinutos: number | null
  medianaMinutos: number | null
  conferenciasNoHistorico: number
}

// Categoria vista na Matriz da aba Alçada e no construtor de regra (alvo "grupo") — sem
// nenhum lugar na UI hoje pra atribuir grupo a um tipo (existia um seletor na linha de Tipos de
// ato, removido a pedido do dono por poluir a lista; ver docs/gaps-requisitos.md §21).
export type GrupoTipoAto = 'Transmissoes' | 'Sucessoes' | 'Familia' | 'Garantias' | 'Notariais'

// Espelha TipoAtoComUsoResponse — leitura agregada pra tabela da aba Tipos de ato (RF-34a).
export type TipoAtoComUso = {
  id: string
  nome: string
  ativo: boolean
  pesoComplexidade: number
  grupo: GrupoTipoAto | null
  // Opcional: a API anterior à fatia 5 não manda.
  tempoReferencia?: TempoReferencia
  volume: number
  conferentesComAlcada: number
}

// Espelha PaginaDeTipoAtoComUsoResponse — primeira paginação de verdade do sistema (o resto do
// app usa busca + rolagem contida no front, ver
// docs/decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md).
export type PaginaDeTipoAtoComUso<T> = {
  itens: T[]
  total: number
}
