import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFIGURACAO_QUERY_KEY } from '@/entities/configuracao'

import { atualizarConfiguracao } from '../api/atualizar-configuracao'

export const useAtualizarConfiguracao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: atualizarConfiguracao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIGURACAO_QUERY_KEY }),
  })
}
