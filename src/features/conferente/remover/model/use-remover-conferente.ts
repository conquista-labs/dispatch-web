import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'
import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { removerConferente } from '../api/remover-conferente'

export const useRemoverConferente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removerConferente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
