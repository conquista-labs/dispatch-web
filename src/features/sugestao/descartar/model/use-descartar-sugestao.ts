import { useMutation, useQueryClient } from '@tanstack/react-query'

import { SUGESTOES_HISTORICO_QUERY_KEY, SUGESTOES_PENDENTES_QUERY_KEY } from '@/entities/sugestao'

import { descartarSugestao } from '../api/descartar-sugestao'

export const useDescartarSugestao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: descartarSugestao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUGESTOES_PENDENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SUGESTOES_HISTORICO_QUERY_KEY })
    },
  })
}
