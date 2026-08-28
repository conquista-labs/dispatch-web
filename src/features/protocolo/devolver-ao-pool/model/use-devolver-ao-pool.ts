import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DETALHE_PROTOCOLO_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { devolverAoPool } from '../api/devolver-ao-pool'

export const useDevolverAoPool = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: devolverAoPool,
    onSuccess: (_data, protocoloId) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(protocoloId) })
    },
  })
}
