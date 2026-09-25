import { httpClient } from '@/shared/api/http-client'

import type { Conta } from '../model/types'

// GET /contas (RF-44) — só Administrador. Vem ordenado por nome.
export const getContas = async (): Promise<Conta[]> => {
  const { data } = await httpClient.get<Conta[]>('/contas')
  return data
}
