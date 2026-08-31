import { useQuery } from '@tanstack/react-query'

import { getRegrasAlcada } from '../api/get-regras-alcada'

export const REGRAS_ALCADA_QUERY_KEY = ['regras-alcada']

// `enabled` existe pro PainelDetalheProtocolo (montado o tempo todo em Distribuição, mesmo
// fechado) poder desligar essa busca quando não há protocolo selecionado.
export const useRegrasAlcada = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: REGRAS_ALCADA_QUERY_KEY,
    queryFn: getRegrasAlcada,
    staleTime: 30_000,
    enabled: options?.enabled,
  })
