import { httpClient } from '@/shared/api/http-client'

export type DefinirObservacaoRequest = {
  protocoloId: string
  observacao: string | null
}

// PUT /protocolos/{id}/observacao (RF-15/RF-23) — Distribuidora sem restrição, Conferente só
// no próprio protocolo (o back decide pelo papel do token, não recebe isso como parâmetro).
export const definirObservacao = async ({ protocoloId, observacao }: DefinirObservacaoRequest): Promise<void> => {
  await httpClient.put(`/protocolos/${protocoloId}/observacao`, { observacao })
}
