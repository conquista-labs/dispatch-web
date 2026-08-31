import { useQuery } from '@tanstack/react-query'

import { getEquipes } from '../api/get-equipes'

export const EQUIPES_QUERY_KEY = ['equipes']

// `enabled` existe pro PainelDetalheProtocolo (montado o tempo todo em Distribuição, mesmo
// fechado) poder desligar essa busca quando não há protocolo selecionado.
export const useEquipes = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: EQUIPES_QUERY_KEY,
    queryFn: getEquipes,
    staleTime: 60_000,
    enabled: options?.enabled,
  })
