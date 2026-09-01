import { useMutation, useQueryClient } from '@tanstack/react-query'

import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { restaurarProtocolo } from '../api/restaurar-protocolo'

export const useRestaurarProtocolo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restaurarProtocolo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
