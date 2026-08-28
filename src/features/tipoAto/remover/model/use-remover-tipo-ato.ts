import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TIPOS_ATO_COM_USO_QUERY_KEY, TIPOS_ATO_QUERY_KEY } from '@/entities/tipoAto'

import { removerTipoAto } from '../api/remover-tipo-ato'

export const useRemoverTipoAto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removerTipoAto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_COM_USO_QUERY_KEY })
    },
  })
}
