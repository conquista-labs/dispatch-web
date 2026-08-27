import { useQuery } from '@tanstack/react-query'

import { getConferentes } from '../api/get-conferentes'

// Catálogo de conferentes muda pouco (cadastro é raro comparado a protocolo mudando de
// status) — staleTime maior que o das entidades de fila, refetch não precisa ser agressivo.
export const useConferentes = () =>
  useQuery({
    queryKey: ['conferentes'],
    queryFn: getConferentes,
    staleTime: 60_000,
  })
