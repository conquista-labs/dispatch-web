import { useQuery } from '@tanstack/react-query'

import { getConfiguracao } from '../api/get-configuracao'

export const CONFIGURACAO_QUERY_KEY = ['configuracao']

export const useConfiguracao = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: CONFIGURACAO_QUERY_KEY,
    queryFn: getConfiguracao,
    staleTime: 60_000,
    enabled: options?.enabled,
  })
