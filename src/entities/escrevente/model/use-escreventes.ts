import { useQuery } from '@tanstack/react-query'

import { getEscreventes } from '../api/get-escreventes'

export const ESCREVENTES_QUERY_KEY = ['escreventes']

// `enabled` existe pro PainelDetalheProtocolo (montado o tempo todo em Distribuição, mesmo
// fechado) poder desligar essa busca quando não há protocolo selecionado.
export const useEscreventes = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ESCREVENTES_QUERY_KEY,
    queryFn: getEscreventes,
    staleTime: 60_000,
    enabled: options?.enabled,
  })
