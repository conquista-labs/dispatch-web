// Espelha TipoAtoResponse (Dispatch.Api/Endpoints/TipoAtoEndpoints.cs).
export type TipoAto = {
  id: string
  nome: string
  ativo: boolean
}

// Espelha TipoAtoComUsoResponse — leitura agregada pra tabela da aba Tipos de ato (RF-34a).
export type TipoAtoComUso = {
  id: string
  nome: string
  ativo: boolean
  pesoComplexidade: number
  volume: number
  conferentesComAlcada: number
}
