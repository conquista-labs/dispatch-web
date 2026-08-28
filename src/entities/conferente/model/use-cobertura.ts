import { useQuery } from '@tanstack/react-query'

import { getCobertura } from '../api/get-cobertura'

export const COBERTURA_QUERY_KEY = ['conferentes', 'cobertura']

export const useCobertura = () =>
  useQuery({
    queryKey: COBERTURA_QUERY_KEY,
    queryFn: getCobertura,
    staleTime: 60_000,
  })
