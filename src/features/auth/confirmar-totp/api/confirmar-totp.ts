import { httpClient } from '@/shared/api/http-client'

export type ConfirmarTotpRequest = {
  codigo: string
}

// POST /auth/totp/confirmar (RF-01d) — autenticado.
export const confirmarTotp = async (request: ConfirmarTotpRequest): Promise<void> => {
  await httpClient.post('/auth/totp/confirmar', request)
}
