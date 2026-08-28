import { useQuery } from '@tanstack/react-query'

import { getVisaoDistribuicao } from '../api/get-visao-distribuicao'

export const VISAO_DISTRIBUICAO_QUERY_KEY = ['protocolos-distribuicao']

// `enabled` existe pro AppShell (badge de pool/exceção no menu, RF-13) poder desligar essa
// query pra quem não é Distribuidora — sem isso, todo usuário logado dispararia uma chamada
// que só o papel Distribuidora tem permissão de fazer.
export const useVisaoDistribuicao = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: VISAO_DISTRIBUICAO_QUERY_KEY,
    queryFn: () => getVisaoDistribuicao(),
    enabled: options?.enabled,
  })
