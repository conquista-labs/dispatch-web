import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONCLUIDOS_HOJE_QUERY_KEY, MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { cancelarPedidoReabertura } from '../api/cancelar-pedido-reabertura'

export const useCancelarPedidoReabertura = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelarPedidoReabertura,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONCLUIDOS_HOJE_QUERY_KEY })
    },
  })
}
