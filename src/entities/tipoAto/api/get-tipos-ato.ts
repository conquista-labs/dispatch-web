import { httpClient } from '@/shared/api/http-client'

import type { TipoAto } from '../model/types'

// GET /tipos-ato — catálogo usado pra resolver nome no alvo de uma regra de alçada (RF-31) e
// no construtor guiado (RF-32).
export const getTiposAto = async (): Promise<TipoAto[]> => {
  const { data } = await httpClient.get<TipoAto[]>('/tipos-ato')
  return data
}
