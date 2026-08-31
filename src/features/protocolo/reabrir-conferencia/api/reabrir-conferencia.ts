import { httpClient } from '@/shared/api/http-client'

// POST /protocolos/{id}/reabrir-conferencia — ação direta do painel de detalhe (RF-18a/RF-24c),
// sem exigir pedido explícito do conferente.
export const reabrirConferencia = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/reabrir-conferencia`)
}
