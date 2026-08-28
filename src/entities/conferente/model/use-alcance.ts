import { useQuery } from '@tanstack/react-query'

import { getAlcance } from '../api/get-alcance'

export const ALCANCE_QUERY_KEY = ['conferentes', 'alcance']

export const useAlcance = () =>
  useQuery({
    queryKey: ALCANCE_QUERY_KEY,
    queryFn: getAlcance,
    staleTime: 60_000,
  })
