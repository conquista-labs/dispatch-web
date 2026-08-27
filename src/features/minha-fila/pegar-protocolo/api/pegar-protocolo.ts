import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/{id}/pegar (RF-20) — 204 No Content; 409 se não estiver no pool, 403 se
// fora da alçada. O axios já rejeita a promise em status >= 400, então a UI trata pelo erro.
export const pegarProtocolo = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/minha-fila/${protocoloId}/pegar`)
}
