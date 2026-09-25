import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'
import { CONTAS_QUERY_KEY } from '@/entities/conta'
import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { desativarConta } from '../api/desativar-conta'

export const useDesativarConta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desativarConta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTAS_QUERY_KEY })
      // Conta que também conferia sai da escala e devolve os protocolos ao pool.
      queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
