import { useQuery } from '@tanstack/react-query'

import { getDashboard } from '../api/get-dashboard'
import type { PeriodoDashboard } from './types'

// Prefixo comum das queries do Dashboard — mutation que muda o score/ritmo invalida todas.
export const DASHBOARD_QUERY_KEY_BASE = ['dashboard']

export const DASHBOARD_QUERY_KEY = (periodo: PeriodoDashboard) => [...DASHBOARD_QUERY_KEY_BASE, periodo]

export const useDashboard = (periodo: PeriodoDashboard) =>
  useQuery({
    queryKey: DASHBOARD_QUERY_KEY(periodo),
    queryFn: () => getDashboard(periodo),
  })
