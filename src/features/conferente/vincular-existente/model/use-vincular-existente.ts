import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFERENTES_QUERY_KEY } from '@/entities/conferente'

import { vincularExistente } from '../api/vincular-existente'

export const useVincularExistente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: vincularExistente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFERENTES_QUERY_KEY }),
  })
}
