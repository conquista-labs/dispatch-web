import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { retomarConferencia } from '../api/retomar-conferencia'

export const useRetomarConferencia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retomarConferencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY }),
  })
}
