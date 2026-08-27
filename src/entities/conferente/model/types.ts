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
}
