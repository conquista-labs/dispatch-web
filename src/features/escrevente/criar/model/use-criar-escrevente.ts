import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ESCREVENTES_QUERY_KEY } from '@/entities/escrevente'

import { criarEscrevente } from '../api/criar-escrevente'

export const useCriarEscrevente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarEscrevente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ESCREVENTES_QUERY_KEY }),
  })
}
