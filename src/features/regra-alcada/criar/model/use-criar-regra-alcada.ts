import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ALCANCE_QUERY_KEY } from '@/entities/conferente'
import { REGRAS_ALCADA_QUERY_KEY } from '@/entities/regraAlcada'

import { criarRegraAlcada } from '../api/criar-regra-alcada'

export const useCriarRegraAlcada = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarRegraAlcada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGRAS_ALCADA_QUERY_KEY })
      // RF-34: o painel de alcance reflete a regra nova na hora.
      queryClient.invalidateQueries({ queryKey: ALCANCE_QUERY_KEY })
    },
  })
}
