import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { pegarProtocolo } from '../api/pegar-protocolo'

export const usePegarProtocolo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pegarProtocolo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY }),
  })
}
