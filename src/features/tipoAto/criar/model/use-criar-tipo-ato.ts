import { useMutation, useQueryClient } from '@tanstack/react-query'

import { TIPOS_ATO_QUERY_KEY } from '@/entities/tipoAto'

import { criarTipoAto } from '../api/criar-tipo-ato'

export const useCriarTipoAto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarTipoAto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIPOS_ATO_QUERY_KEY }),
  })
}
