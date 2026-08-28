import { useQuery } from '@tanstack/react-query'

import { getDetalheProtocolo } from '../api/get-detalhe-protocolo'

export const DETALHE_PROTOCOLO_QUERY_KEY = (id: string) => ['protocolos', id, 'detalhe']

// `enabled: !!id` — o painel só busca quando está de fato aberto (id não nulo), mesmo padrão
// do badge do menu lateral.
export const useDetalheProtocolo = (id: string | null) =>
  useQuery({
    queryKey: DETALHE_PROTOCOLO_QUERY_KEY(id ?? ''),
    queryFn: () => getDetalheProtocolo(id!),
    enabled: !!id,
  })
