import { useQuery } from '@tanstack/react-query'

import { getPedidosReaberturaPendentes } from '../api/get-pedidos-reabertura-pendentes'

export const PEDIDOS_REABERTURA_QUERY_KEY = ['protocolos', 'pedidos-reabertura']

export const usePedidosReaberturaPendentes = () =>
  useQuery({
    queryKey: PEDIDOS_REABERTURA_QUERY_KEY,
    queryFn: getPedidosReaberturaPendentes,
  })
