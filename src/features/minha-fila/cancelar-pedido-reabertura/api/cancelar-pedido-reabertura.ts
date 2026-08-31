import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/pedidos-reabertura/{id}/cancelar (RF-24b) — só enquanto pendente.
export const cancelarPedidoReabertura = async (pedidoId: string): Promise<void> => {
  await httpClient.post(`/minha-fila/pedidos-reabertura/${pedidoId}/cancelar`)
}
