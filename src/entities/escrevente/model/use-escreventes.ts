import { useQuery } from '@tanstack/react-query'

import { getEscreventes } from '../api/get-escreventes'
import { getEscreventesSemEquipe } from '../api/get-escreventes-sem-equipe'

export const ESCREVENTES_QUERY_KEY = ['escreventes']
export const ESCREVENTES_SEM_EQUIPE_QUERY_KEY = ['escreventes', 'sem-equipe']

export const useEscreventes = () =>
  useQuery({
    queryKey: ESCREVENTES_QUERY_KEY,
    queryFn: getEscreventes,
    staleTime: 60_000,
  })

export const useEscreventesSemEquipe = () =>
  useQuery({
    queryKey: ESCREVENTES_SEM_EQUIPE_QUERY_KEY,
    queryFn: getEscreventesSemEquipe,
    staleTime: 60_000,
  })
