import { httpClient } from '@/shared/api/http-client'

// DELETE /protocolos/{id} (RF-18i) — soft-delete, some de toda tela mas fica restaurável.
export const excluirProtocolo = async (protocoloId: string): Promise<void> => {
  await httpClient.delete(`/protocolos/${protocoloId}`)
}
