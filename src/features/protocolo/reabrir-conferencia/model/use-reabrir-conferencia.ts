import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DETALHE_PROTOCOLO_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { reabrirConferencia } from '../api/reabrir-conferencia'

export const useReabrirConferencia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reabrirConferencia,
    onSuccess: (_data, protocoloId) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(protocoloId) })
    },
  })
}
