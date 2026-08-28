// Espelha ConferenteComUsuario (Dispatch.Api/Endpoints/ConferenteEndpoints.cs) — RF-25.
export type Nivel = 'Junior' | 'Pleno' | 'Senior'

export type Conferente = {
  id: string
  nome: string
  email: string
  ativo: boolean
  nivel: Nivel
  jornadaHoras: number
  naEscala: boolean
  cargaAtual: number
  // RF-28: jornada ÷ 18min por ato (premissa da seção 11 do requisito) — vem pronto do back,
  // o front não recalcula.
  capacidadeEstimada: number
}

// Espelha AlcanceDoConferente (RegraAlcadaEndpoints.cs) — RF-29/RF-34.
export type AlcanceDoConferente = {
  conferenteId: string
  etapasPermitidas: ('PreConferencia' | 'PosConferencia')[]
  tiposPermitidosIds: string[]
}

// Espelha CoberturaAlcada/TipoDeAtoResumo (ConferenteEndpoints.cs) — RF-30.
export type TipoDeAtoResumo = {
  tipoAtoId: string
  nome: string
}

export type CoberturaAlcada = {
  semNinguemHabilitado: TipoDeAtoResumo[]
  dependeDeUmaPessoa: TipoDeAtoResumo[]
}
