import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DASHBOARD_QUERY_KEY_BASE } from '@/entities/dashboard'
import { TIPOS_ATO_COM_USO_QUERY_KEY } from '@/entities/tipoAto'

import { definirTempoReferencia } from '../api/definir-tempo-referencia'

export const useDefinirTempoReferencia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirTempoReferencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_COM_USO_QUERY_KEY })
      // O ritmo do Dashboard é calculado contra essa referência.
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY_BASE })
    },
  })
}
