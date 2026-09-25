import { useQuery } from '@tanstack/react-query'

import { getContas } from '../api/get-contas'

export const CONTAS_QUERY_KEY = ['contas']

export const useContas = () => useQuery({ queryKey: CONTAS_QUERY_KEY, queryFn: getContas })
