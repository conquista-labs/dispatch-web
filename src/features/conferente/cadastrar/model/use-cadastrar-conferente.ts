import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'

import { cadastrarConferente } from '../api/cadastrar-conferente'

export const useCadastrarConferente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cadastrarConferente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY }),
  })
}
