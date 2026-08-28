import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'

import { editarNivelEJornada } from '../api/editar-nivel-jornada'

export const useEditarNivelEJornada = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: editarNivelEJornada,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY }),
  })
}
