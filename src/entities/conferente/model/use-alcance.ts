import { useQuery } from '@tanstack/react-query'

import { getAlcance } from '../api/get-alcance'

export const useAlcance = () =>
  useQuery({
    queryKey: ['conferentes', 'alcance'],
    queryFn: getAlcance,
    staleTime: 60_000,
  })
