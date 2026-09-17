import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { pausarConferencia } from '../api/pausar-conferencia'

export const usePausarConferencia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pausarConferencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY }),
  })
}
