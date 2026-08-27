import type { Usuario } from '@/entities/usuario'
import { httpClient } from '@/shared/api/http-client'

export type LoginRequest = {
  email: string
  senha: string
}

export type LoginResponse = {
  token: string
  usuario: Usuario
}

// POST /auth/login (RF-01/RF-02).
export const login = async (request: LoginRequest): Promise<LoginResponse> => {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', request)
  return data
}
