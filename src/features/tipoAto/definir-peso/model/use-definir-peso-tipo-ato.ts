import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TIPOS_ATO_COM_USO_QUERY_KEY } from '@/entities/tipoAto'

import { definirPesoTipoAto } from '../api/definir-peso-tipo-ato'

export const useDefinirPesoTipoAto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirPesoTipoAto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIPOS_ATO_COM_USO_QUERY_KEY }),
  })
}
