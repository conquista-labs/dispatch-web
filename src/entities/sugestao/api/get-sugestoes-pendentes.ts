import { httpClient } from '@/shared/api/http-client'

import type { Sugestao } from '../model/types'

// GET /sugestoes — fila de propostas pendentes (RF-39).
export const getSugestoesPendentes = async (): Promise<Sugestao[]> => {
  const { data } = await httpClient.get<Sugestao[]>('/sugestoes')
  return data
}
