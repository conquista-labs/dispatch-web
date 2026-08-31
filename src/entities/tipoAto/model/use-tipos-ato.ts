import { useQuery } from '@tanstack/react-query'

import { getTiposAto } from '../api/get-tipos-ato'

export const TIPOS_ATO_QUERY_KEY = ['tipos-ato']

// Catálogo muda raramente — mesmo staleTime de conferentes/equipes. `enabled` existe pro
// PainelDetalheProtocolo (montado o tempo todo em Distribuição, mesmo fechado) poder desligar
// essa busca quando não há protocolo selecionado.
export const useTiposAto = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: TIPOS_ATO_QUERY_KEY,
    queryFn: getTiposAto,
    staleTime: 60_000,
    enabled: options?.enabled,
  })
