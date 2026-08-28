import { httpClient } from '@/shared/api/http-client'

import type { Escrevente } from '../model/types'

// GET /escreventes/sem-equipe (RF-37).
export const getEscreventesSemEquipe = async (): Promise<Escrevente[]> => {
  const { data } = await httpClient.get<Escrevente[]>('/escreventes/sem-equipe')
  return data
}
