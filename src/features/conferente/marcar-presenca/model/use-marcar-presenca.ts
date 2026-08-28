import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'
import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { marcarPresenca } from '../api/marcar-presenca'

export const useMarcarPresenca = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: marcarPresenca,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY })
      // RF-27: ausência devolve protocolos pro pool — a visão de Distribuição muda junto.
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
