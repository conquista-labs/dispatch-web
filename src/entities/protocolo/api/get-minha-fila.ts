import { httpClient } from '@/shared/api/http-client'

import type { ProtocoloResumo } from '../model/types'

export type MinhaFila = {
  poolDisponivel: ProtocoloResumo[]
  atribuidos: ProtocoloResumo[]
  emConferencia: ProtocoloResumo[]
}

// GET /minha-fila (RF-19) — as 3 colunas do conferente, pool já filtrado pela alçada dele.
export const getMinhaFila = async (): Promise<MinhaFila> => {
  const { data } = await httpClient.get<MinhaFila>('/minha-fila')
  return data
}
