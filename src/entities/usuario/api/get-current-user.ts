import { httpClient } from '@/shared/api/http-client'

import type { Usuario } from '../model/types'

// GET /auth/me — reidrata a sessão a partir do token persistido, revalidado no servidor.
export const getCurrentUser = async (): Promise<Usuario> => {
  const { data } = await httpClient.get<Usuario>('/auth/me')
  return data
}
