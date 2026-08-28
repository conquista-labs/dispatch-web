import { useMutation, useQueryClient } from '@tanstack/react-query'

import { EQUIPES_QUERY_KEY } from '@/entities/equipe'

import { criarEquipe } from '../api/criar-equipe'

export const useCriarEquipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarEquipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EQUIPES_QUERY_KEY }),
  })
}
