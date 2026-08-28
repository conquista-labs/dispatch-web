import { httpClient } from '@/shared/api/http-client'

import type { TipoAtoComUso } from '../model/types'

// GET /tipos-ato/com-uso — catálogo com volume e cobertura de alçada, pra tabela da aba
// Tipos de ato (RF-34a).
export const getTiposAtoComUso = async (): Promise<TipoAtoComUso[]> => {
  const { data } = await httpClient.get<TipoAtoComUso[]>('/tipos-ato/com-uso')
  return data
}
