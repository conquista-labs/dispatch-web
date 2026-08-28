import { useQuery } from '@tanstack/react-query'

import { getConferentes } from '../api/get-conferentes'

export const CONFERENTES_QUERY_KEY = ['conferentes']

// Catálogo de conferentes muda pouco (cadastro é raro comparado a protocolo mudando de
// status) — staleTime maior que o das entidades de fila, refetch não precisa ser agressivo.
export const useConferentes = () =>
  useQuery({
    queryKey: CONFERENTES_QUERY_KEY,
    queryFn: getConferentes,
    staleTime: 60_000,
  })
