import { httpClient } from '@/shared/api/http-client'

import type { Equipe } from '../model/types'

// GET /equipes (RF-35).
export const getEquipes = async (): Promise<Equipe[]> => {
  const { data } = await httpClient.get<Equipe[]>('/equipes')
  return data
}
