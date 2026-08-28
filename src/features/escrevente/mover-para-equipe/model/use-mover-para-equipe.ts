import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ESCREVENTES_QUERY_KEY, ESCREVENTES_SEM_EQUIPE_QUERY_KEY } from '@/entities/escrevente'

import { moverParaEquipe } from '../api/mover-para-equipe'

export const useMoverParaEquipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: moverParaEquipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ESCREVENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ESCREVENTES_SEM_EQUIPE_QUERY_KEY })
    },
  })
}
