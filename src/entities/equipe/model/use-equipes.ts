import { useQuery } from '@tanstack/react-query'

import { getEquipes } from '../api/get-equipes'

export const EQUIPES_QUERY_KEY = ['equipes']

export const useEquipes = () =>
  useQuery({
    queryKey: EQUIPES_QUERY_KEY,
    queryFn: getEquipes,
    staleTime: 60_000,
  })
