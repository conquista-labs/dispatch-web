import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TIPOS_ATO_COM_USO_QUERY_KEY, TIPOS_ATO_QUERY_KEY } from '@/entities/tipoAto'

import { renomearTipoAto } from '../api/renomear-tipo-ato'

export const useRenomearTipoAto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: renomearTipoAto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_COM_USO_QUERY_KEY })
    },
  })
}
