import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DETALHE_PROTOCOLO_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { atribuirManualmente } from '../api/atribuir-manualmente'

export const useAtribuirManualmente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: atribuirManualmente,
    // DETALHE_PROTOCOLO_QUERY_KEY também invalida agora — passou a ser chamado de dentro do
    // painel de detalhe (AcoesDeStatus), não só do card de Exceção (que nunca reabre o painel).
    onSuccess: (_data, { protocoloId }) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(protocoloId) })
    },
  })
}
