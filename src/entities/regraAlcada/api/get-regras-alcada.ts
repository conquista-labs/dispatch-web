import { httpClient } from '@/shared/api/http-client'

import type { RegraAlcada } from '../model/types'

// GET /regras-alcada — todas, ativas e inativas (RF-31/RF-33).
export const getRegrasAlcada = async (): Promise<RegraAlcada[]> => {
  const { data } = await httpClient.get<RegraAlcada[]>('/regras-alcada')
  return data
}
