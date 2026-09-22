import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  CONCLUIDOS_HOJE_QUERY_KEY,
  DETALHE_PROTOCOLO_QUERY_KEY,
  VISAO_DISTRIBUICAO_QUERY_KEY,
} from '@/entities/protocolo'

import { ajustarDuracao } from '../api/ajustar-duracao'

export const useAjustarDuracao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ajustarDuracao,
    onSuccess: (_data, { protocoloId }) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(protocoloId) })
      queryClient.invalidateQueries({ queryKey: CONCLUIDOS_HOJE_QUERY_KEY })
      // Pedido do dono: o ajuste tem que refletir no tempo médio do conferente — sem período
      // fixo aqui (a mutation não sabe qual aba do Dashboard está aberta), invalida o prefixo
      // inteiro (TanStack casa por prefixo em array key).
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
