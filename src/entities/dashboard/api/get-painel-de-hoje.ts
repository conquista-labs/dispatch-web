import { httpClient } from '@/shared/api/http-client'

import type { PainelDeHoje } from '../model/types'

// GET /dashboard/hoje (RF-42a) — o back decide a visão pelo papel do token.
export const getPainelDeHoje = async (): Promise<PainelDeHoje> => {
  const { data } = await httpClient.get<PainelDeHoje>('/dashboard/hoje')
  return data
}
