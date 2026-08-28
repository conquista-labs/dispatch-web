import { useQuery } from '@tanstack/react-query'

import { getRegrasAlcada } from '../api/get-regras-alcada'

export const REGRAS_ALCADA_QUERY_KEY = ['regras-alcada']

export const useRegrasAlcada = () =>
  useQuery({
    queryKey: REGRAS_ALCADA_QUERY_KEY,
    queryFn: getRegrasAlcada,
    staleTime: 30_000,
  })
