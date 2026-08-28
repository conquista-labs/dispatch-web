import { httpClient } from '@/shared/api/http-client'

import type { AlcanceDoConferente } from '../model/types'

// GET /conferentes/alcance (RF-29/RF-34) — quantos tipos de ato e quais etapas cada
// conferente alcança hoje, direto das regras de alçada ativas.
export const getAlcance = async (): Promise<AlcanceDoConferente[]> => {
  const { data } = await httpClient.get<AlcanceDoConferente[]>('/conferentes/alcance')
  return data
}
