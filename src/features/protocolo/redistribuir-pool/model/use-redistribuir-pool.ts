import { useMutation, useQueryClient } from '@tanstack/react-query'

import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { redistribuirPool } from '../api/redistribuir-pool'

export const useRedistribuirPool = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: redistribuirPool,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY }),
  })
}
