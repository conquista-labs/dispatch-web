import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DETALHE_PROTOCOLO_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { definirPrioridade } from '../api/definir-prioridade'

export const useDefinirPrioridade = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirPrioridade,
    onSuccess: (_data, { protocoloId }) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(protocoloId) })
    },
  })
}
