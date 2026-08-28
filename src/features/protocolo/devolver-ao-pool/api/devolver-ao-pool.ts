import { httpClient } from '@/shared/api/http-client'

// POST /protocolos/{id}/devolver-ao-pool (RF-18a) — ação pontual num item só, diferente de
// redistribuir-pool (RF-16, em lote).
export const devolverAoPool = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/devolver-ao-pool`)
}
