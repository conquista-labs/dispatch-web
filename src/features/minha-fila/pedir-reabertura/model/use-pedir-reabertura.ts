import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONCLUIDOS_HOJE_QUERY_KEY, MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { pedirReabertura } from '../api/pedir-reabertura'

export const usePedirReabertura = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pedirReabertura,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONCLUIDOS_HOJE_QUERY_KEY })
    },
  })
}
