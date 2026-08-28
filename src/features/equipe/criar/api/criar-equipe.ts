import type { TipoPrazo } from '@/entities/protocolo'
import { httpClient } from '@/shared/api/http-client'

export type CriarEquipeRequest = {
  nome: string
  prazoPreConferencia: TipoPrazo
  prazoPosConferencia: TipoPrazo
}

// POST /equipes (RF-35).
export const criarEquipe = async (request: CriarEquipeRequest): Promise<{ equipeId: string }> => {
  const { data } = await httpClient.post<{ equipeId: string }>('/equipes', request)
  return data
}
