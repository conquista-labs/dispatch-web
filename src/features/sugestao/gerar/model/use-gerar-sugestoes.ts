import { useMutation, useQueryClient } from '@tanstack/react-query'

import { SUGESTOES_PENDENTES_QUERY_KEY } from '@/entities/sugestao'

import { gerarSugestoes } from '../api/gerar-sugestoes'

export const useGerarSugestoes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: gerarSugestoes,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUGESTOES_PENDENTES_QUERY_KEY }),
  })
}
