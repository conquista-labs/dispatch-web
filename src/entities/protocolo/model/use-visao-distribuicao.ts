import { useQuery } from '@tanstack/react-query'

import { getVisaoDistribuicao } from '../api/get-visao-distribuicao'

export const VISAO_DISTRIBUICAO_QUERY_KEY = ['protocolos-distribuicao']

export const useVisaoDistribuicao = () =>
  useQuery({
    queryKey: VISAO_DISTRIBUICAO_QUERY_KEY,
    queryFn: () => getVisaoDistribuicao(),
  })
