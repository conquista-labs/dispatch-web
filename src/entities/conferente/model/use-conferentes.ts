import { useQuery } from '@tanstack/react-query'

import { getConferentes } from '../api/get-conferentes'

export const CONFERENTES_QUERY_KEY = ['conferentes']

// Catálogo de conferentes muda pouco (cadastro é raro comparado a protocolo mudando de
// status) — staleTime maior que o das entidades de fila, refetch não precisa ser agressivo.
// `enabled` existe pro PainelDetalheProtocolo (montado o tempo todo em Distribuição, mesmo
// fechado) poder desligar essa busca quando não há protocolo selecionado.
export const useConferentes = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: CONFERENTES_QUERY_KEY,
    queryFn: getConferentes,
    staleTime: 60_000,
    enabled: options?.enabled,
  })
