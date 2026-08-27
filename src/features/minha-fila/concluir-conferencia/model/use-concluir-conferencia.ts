import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONCLUIDOS_HOJE_QUERY_KEY, MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { concluirConferencia } from '../api/concluir-conferencia'

export const useConcluirConferencia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: concluirConferencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONCLUIDOS_HOJE_QUERY_KEY })
    },
  })
}
