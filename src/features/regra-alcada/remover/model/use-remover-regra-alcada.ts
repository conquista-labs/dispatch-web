import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ALCANCE_QUERY_KEY } from '@/entities/conferente'
import { REGRAS_ALCADA_QUERY_KEY } from '@/entities/regraAlcada'

import { removerRegraAlcada } from '../api/remover-regra-alcada'

export const useRemoverRegraAlcada = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removerRegraAlcada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGRAS_ALCADA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ALCANCE_QUERY_KEY })
    },
  })
}
