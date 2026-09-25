import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONTAS_QUERY_KEY } from '@/entities/conta'

import { criarConta } from '../api/criar-conta'

export const useCriarConta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarConta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTAS_QUERY_KEY }),
  })
}
