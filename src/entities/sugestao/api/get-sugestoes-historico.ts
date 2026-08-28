import { httpClient } from '@/shared/api/http-client'

import type { Sugestao } from '../model/types'

// GET /sugestoes/historico — aplicadas e descartadas, com o efeito de cada decisão (RF-41).
export const getSugestoesHistorico = async (): Promise<Sugestao[]> => {
  const { data } = await httpClient.get<Sugestao[]>('/sugestoes/historico')
  return data
}
