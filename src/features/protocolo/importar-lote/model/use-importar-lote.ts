import { useMutation, useQueryClient } from '@tanstack/react-query'

import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { confirmarLote, preVisualizarLote } from '../api/importar-lote'

// RF-11: prévia não grava nada, então não precisa invalidar cache nenhum.
export const usePreVisualizarLote = () => useMutation({ mutationFn: preVisualizarLote })

export const useConfirmarLote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmarLote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY }),
  })
}
