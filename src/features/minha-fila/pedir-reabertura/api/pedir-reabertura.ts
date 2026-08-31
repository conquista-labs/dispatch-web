import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/{id}/pedir-reabertura (RF-24b) — fora da janela de correção, abre pedido
// pra distribuidora decidir.
export const pedirReabertura = async (protocoloId: string): Promise<{ pedidoId: string }> => {
  const { data } = await httpClient.post<{ pedidoId: string }>(`/minha-fila/${protocoloId}/pedir-reabertura`)
  return data
}
