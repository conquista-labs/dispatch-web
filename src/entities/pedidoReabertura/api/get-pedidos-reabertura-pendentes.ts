import { httpClient } from '@/shared/api/http-client'

import type { PedidoReabertura } from '../model/types'

// GET /protocolos/pedidos-reabertura — pra seção "Pedidos de reabertura" da aba Exceções (RF-24c).
export const getPedidosReaberturaPendentes = async (): Promise<PedidoReabertura[]> => {
  const { data } = await httpClient.get<PedidoReabertura[]>('/protocolos/pedidos-reabertura')
  return data
}
