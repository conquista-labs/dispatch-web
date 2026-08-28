import { useQuery } from '@tanstack/react-query'

import { getTiposAtoComUso } from '../api/get-tipos-ato-com-uso'

export const TIPOS_ATO_COM_USO_QUERY_KEY = ['tipos-ato', 'com-uso']

export const useTiposAtoComUso = () =>
  useQuery({
    queryKey: TIPOS_ATO_COM_USO_QUERY_KEY,
    queryFn: getTiposAtoComUso,
    staleTime: 30_000,
  })
