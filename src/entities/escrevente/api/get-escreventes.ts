import { httpClient } from '@/shared/api/http-client'

import type { Escrevente } from '../model/types'

// GET /escreventes — todos, com equipeId (RF-14/RF-35).
export const getEscreventes = async (): Promise<Escrevente[]> => {
  const { data } = await httpClient.get<Escrevente[]>('/escreventes')
  return data
}
