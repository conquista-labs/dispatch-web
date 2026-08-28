import { httpClient } from '@/shared/api/http-client'

import type { DetalheProtocolo } from '../model/types'

// GET /protocolos/{id}/detalhe (RF-18a) — todos os campos do protocolo, mais quem pode
// conferir este ato especificamente.
export const getDetalheProtocolo = async (id: string): Promise<DetalheProtocolo> => {
  const { data } = await httpClient.get<DetalheProtocolo>(`/protocolos/${id}/detalhe`)
  return data
}
