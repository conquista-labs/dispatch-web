import { httpClient } from '@/shared/api/http-client'

import type { MinhaFila } from './get-minha-fila'

// GET /conferentes/{id}/fila (RF-19) — Distribuidora vendo a fila de um conferente
// específico, em leitura. Mesma forma de resposta de /minha-fila (MinhaFila reaproveitado).
export const getFilaDoConferente = async (conferenteId: string): Promise<MinhaFila> => {
  const { data } = await httpClient.get<MinhaFila>(`/conferentes/${conferenteId}/fila`)
  return data
}
