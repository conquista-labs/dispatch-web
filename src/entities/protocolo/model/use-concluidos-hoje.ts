import { useQuery } from '@tanstack/react-query'

import { getConcluidosHoje } from '../api/get-concluidos-hoje'

export const CONCLUIDOS_HOJE_QUERY_KEY = ['minha-fila', 'concluidos-hoje']

export const useConcluidosHoje = () =>
  useQuery({
    queryKey: CONCLUIDOS_HOJE_QUERY_KEY,
    queryFn: getConcluidosHoje,
  })
