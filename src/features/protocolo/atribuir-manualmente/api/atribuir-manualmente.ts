import { httpClient } from '@/shared/api/http-client'

export type AtribuirManualmenteRequest = {
  protocoloId: string
  conferenteId: string
}

// POST /protocolos/{id}/atribuir — funciona com o protocolo no pool, em exceção (RF-17) ou já
// atribuído a outra pessoa (redireciona direto, sem passar pelo pool).
export const atribuirManualmente = async ({ protocoloId, conferenteId }: AtribuirManualmenteRequest): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/atribuir`, { conferenteId })
}
