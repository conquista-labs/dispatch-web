import { httpClient } from '@/shared/api/http-client'

export type AtribuirManualmenteRequest = {
  protocoloId: string
  conferenteId: string
}

// POST /protocolos/{id}/atribuir (RF-17) — só funciona se o protocolo estiver em exceção.
export const atribuirManualmente = async ({ protocoloId, conferenteId }: AtribuirManualmenteRequest): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/atribuir`, { conferenteId })
}
