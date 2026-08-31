import { httpClient } from '@/shared/api/http-client'

import type { Dashboard, PeriodoDashboard } from '../model/types'

// GET /dashboard?periodo=... (RF-42-46).
export const getDashboard = async (periodo: PeriodoDashboard): Promise<Dashboard> => {
  const { data } = await httpClient.get<Dashboard>('/dashboard', { params: { periodo } })
  return data
}
