import { httpClient } from '@/shared/api/http-client'

import type { Configuracao } from '../model/types'

// GET /config (seção 8).
export const getConfiguracao = async (): Promise<Configuracao> => {
  const { data } = await httpClient.get<Configuracao>('/config')
  return data
}
