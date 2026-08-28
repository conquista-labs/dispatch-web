import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TIPOS_ATO_COM_USO_QUERY_KEY, TIPOS_ATO_QUERY_KEY } from '@/entities/tipoAto'

import { alterarStatusTipoAto } from '../api/alterar-status-tipo-ato'

export const useAlterarStatusTipoAto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: alterarStatusTipoAto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_COM_USO_QUERY_KEY })
    },
  })
}
