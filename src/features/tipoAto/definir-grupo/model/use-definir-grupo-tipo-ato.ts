import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TIPOS_ATO_COM_USO_QUERY_KEY } from '@/entities/tipoAto'

import { definirGrupoTipoAto } from '../api/definir-grupo-tipo-ato'

export const useDefinirGrupoTipoAto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirGrupoTipoAto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIPOS_ATO_COM_USO_QUERY_KEY }),
  })
}
