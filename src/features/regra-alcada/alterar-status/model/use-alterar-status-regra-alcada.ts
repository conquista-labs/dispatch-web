import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ALCANCE_QUERY_KEY } from '@/entities/conferente'
import { REGRAS_ALCADA_QUERY_KEY } from '@/entities/regraAlcada'

import { alterarStatusRegraAlcada } from '../api/alterar-status-regra-alcada'

export const useAlterarStatusRegraAlcada = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: alterarStatusRegraAlcada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGRAS_ALCADA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ALCANCE_QUERY_KEY })
    },
  })
}
