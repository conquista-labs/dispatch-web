import { httpClient } from '@/shared/api/http-client'

export type DecidirPedidoReaberturaRequest = {
  pedidoId: string
  aprovar: boolean
}

// POST /protocolos/pedidos-reabertura/{id}/aprovar | /negar (RF-24c).
export const decidirPedidoReabertura = async ({ pedidoId, aprovar }: DecidirPedidoReaberturaRequest): Promise<void> => {
  await httpClient.post(`/protocolos/pedidos-reabertura/${pedidoId}/${aprovar ? 'aprovar' : 'negar'}`)
}
