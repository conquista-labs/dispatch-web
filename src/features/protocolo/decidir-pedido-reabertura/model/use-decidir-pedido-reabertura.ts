import { useMutation, useQueryClient } from '@tanstack/react-query'

import { PEDIDOS_REABERTURA_QUERY_KEY } from '@/entities/pedidoReabertura'
import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { decidirPedidoReabertura } from '../api/decidir-pedido-reabertura'

export const useDecidirPedidoReabertura = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: decidirPedidoReabertura,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEDIDOS_REABERTURA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
