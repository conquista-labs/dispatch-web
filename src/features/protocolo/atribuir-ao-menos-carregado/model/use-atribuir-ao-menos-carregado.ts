import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DETALHE_PROTOCOLO_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { atribuirAoMenosCarregado } from '../api/atribuir-ao-menos-carregado'

export const useAtribuirAoMenosCarregado = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: atribuirAoMenosCarregado,
    onSuccess: (_data, protocoloId) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(protocoloId) })
    },
  })
}
