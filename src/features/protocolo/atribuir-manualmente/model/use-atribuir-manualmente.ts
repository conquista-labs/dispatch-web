import { useMutation, useQueryClient } from '@tanstack/react-query'

import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { atribuirManualmente } from '../api/atribuir-manualmente'

export const useAtribuirManualmente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: atribuirManualmente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY }),
  })
}
