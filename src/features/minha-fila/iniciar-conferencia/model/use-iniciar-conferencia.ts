import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { iniciarConferencia } from '../api/iniciar-conferencia'

export const useIniciarConferencia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: iniciarConferencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY }),
  })
}
