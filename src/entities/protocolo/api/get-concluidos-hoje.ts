import { httpClient } from '@/shared/api/http-client'

import type { ProtocoloConcluidoResumo } from '../model/types'

// GET /minha-fila/concluidos-hoje (RF-24).
export const getConcluidosHoje = async (): Promise<ProtocoloConcluidoResumo[]> => {
  const { data } = await httpClient.get<ProtocoloConcluidoResumo[]>('/minha-fila/concluidos-hoje')
  return data
}
