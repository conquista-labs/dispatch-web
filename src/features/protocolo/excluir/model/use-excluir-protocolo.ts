import { useMutation, useQueryClient } from '@tanstack/react-query'

import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { excluirProtocolo } from '../api/excluir-protocolo'

export const useExcluirProtocolo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: excluirProtocolo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
