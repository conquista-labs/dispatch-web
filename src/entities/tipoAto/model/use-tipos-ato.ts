import { useQuery } from '@tanstack/react-query'

import { getTiposAto } from '../api/get-tipos-ato'

export const TIPOS_ATO_QUERY_KEY = ['tipos-ato']

// Catálogo muda raramente — mesmo staleTime de conferentes/equipes.
export const useTiposAto = () =>
  useQuery({
    queryKey: TIPOS_ATO_QUERY_KEY,
    queryFn: getTiposAto,
    staleTime: 60_000,
  })
