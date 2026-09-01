import { httpClient } from '@/shared/api/http-client'

// POST /protocolos/{id}/restaurar (RF-18j) — desfazer a exclusão, mesmo vencimento/dono/
// histórico de antes.
export const restaurarProtocolo = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/restaurar`)
}
