import { httpClient } from '@/shared/api/http-client'

import type { ProtocoloConcluidoResumo } from '../model/types'

// GET /conferentes/{id}/concluidos-hoje (RF-24) — mesma leitura de /minha-fila/concluidos-hoje,
// só que de um conferente escolhido pela Distribuidora, não do próprio token.
export const getConcluidosHojeDoConferente = async (conferenteId: string): Promise<ProtocoloConcluidoResumo[]> => {
  const { data } = await httpClient.get<ProtocoloConcluidoResumo[]>(`/conferentes/${conferenteId}/concluidos-hoje`)
  return data
}
