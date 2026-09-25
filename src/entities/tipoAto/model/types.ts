// Espelha TipoAtoResponse (Dispatch.Api/Endpoints/TipoAtoEndpoints.cs).
export type TipoAto = {
  id: string
  nome: string
  ativo: boolean
  grupo: GrupoTipoAto | null
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
