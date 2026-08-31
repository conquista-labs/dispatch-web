import { useQuery } from '@tanstack/react-query'

import { getDashboard } from '../api/get-dashboard'
import type { PeriodoDashboard } from './types'

export const DASHBOARD_QUERY_KEY = (periodo: PeriodoDashboard) => ['dashboard', periodo]

export const useDashboard = (periodo: PeriodoDashboard) =>
  useQuery({
    queryKey: DASHBOARD_QUERY_KEY(periodo),
    queryFn: () => getDashboard(periodo),
  })
