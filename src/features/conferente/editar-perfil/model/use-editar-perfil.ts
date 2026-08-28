import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'

import { editarPerfil } from '../api/editar-perfil'

export const useEditarPerfil = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: editarPerfil,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY }),
  })
}
