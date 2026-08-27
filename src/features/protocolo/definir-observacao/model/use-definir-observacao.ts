import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { definirObservacao } from '../api/definir-observacao'

export const useDefinirObservacao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirObservacao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY }),
  })
}
