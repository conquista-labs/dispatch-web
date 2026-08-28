import { httpClient } from '@/shared/api/http-client'

import type { CoberturaAlcada } from '../model/types'

// GET /conferentes/cobertura (RF-30) — tipos de ato em circulação sem ninguém habilitado, ou
// dependentes de uma só pessoa na escala.
export const getCobertura = async (): Promise<CoberturaAlcada> => {
  const { data } = await httpClient.get<CoberturaAlcada>('/conferentes/cobertura')
  return data
}
