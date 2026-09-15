import { httpClient } from '@/shared/api/http-client'
import type { Nivel } from '@/entities/conferente'

export type VincularExistenteRequest = {
  email: string
  nivel: Nivel
  jornadaHoras: number
}

// POST /conferentes/vincular — dá a alçada de conferente a uma conta já existente (ex.: a
// distribuidora que também confere pessoalmente), sem criar um Usuario novo.
export const vincularExistente = async (request: VincularExistenteRequest): Promise<void> => {
  await httpClient.post('/conferentes/vincular', request)
}
