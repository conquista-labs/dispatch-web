import { useMutation, useQueryClient } from '@tanstack/react-query'

import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { descartarExcecao } from '../api/descartar-excecao'

export const useDescartarExcecao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: descartarExcecao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY }),
  })
}
