import { httpClient } from '@/shared/api/http-client'
import type { Nivel } from '@/entities/conferente'

export type CadastrarConferenteRequest = {
  nome: string
  email: string
  senha: string
  nivel: Nivel
  jornadaHoras: number
}

// POST /conferentes (RF-25) — cria o Conferente e o Usuario de login dele junto.
export const cadastrarConferente = async (request: CadastrarConferenteRequest): Promise<void> => {
  await httpClient.post('/conferentes', request)
}
