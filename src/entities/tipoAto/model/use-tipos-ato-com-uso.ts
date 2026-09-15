import { useQuery } from '@tanstack/react-query'

import { getTiposAtoComUso, type ParametrosTiposAtoComUso } from '../api/get-tipos-ato-com-uso'

export const TIPOS_ATO_COM_USO_QUERY_KEY = ['tipos-ato', 'com-uso']

export const useTiposAtoComUso = (params: ParametrosTiposAtoComUso) =>
  useQuery({
    queryKey: [...TIPOS_ATO_COM_USO_QUERY_KEY, params],
    queryFn: () => getTiposAtoComUso(params),
    staleTime: 30_000,
    placeholderData: (dadoAnterior) => dadoAnterior,
  })
