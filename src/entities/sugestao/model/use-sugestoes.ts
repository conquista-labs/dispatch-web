import { useQuery } from '@tanstack/react-query'

import { getSugestoesHistorico } from '../api/get-sugestoes-historico'
import { getSugestoesPendentes } from '../api/get-sugestoes-pendentes'

export const SUGESTOES_PENDENTES_QUERY_KEY = ['sugestoes', 'pendentes']
export const SUGESTOES_HISTORICO_QUERY_KEY = ['sugestoes', 'historico']

export const useSugestoesPendentes = () =>
  useQuery({
    queryKey: SUGESTOES_PENDENTES_QUERY_KEY,
    queryFn: getSugestoesPendentes,
    staleTime: 30_000,
  })

export const useSugestoesHistorico = () =>
  useQuery({
    queryKey: SUGESTOES_HISTORICO_QUERY_KEY,
    queryFn: getSugestoesHistorico,
    staleTime: 30_000,
  })
