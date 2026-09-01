import { httpClient } from '@/shared/api/http-client'

export type RegistrarTotpResponse = {
  chaveBase32: string
  uriOtpAuth: string
}

// POST /auth/totp/registrar (RF-01a-c) — autenticado, gera um segredo TOTP novo (pendente de
// confirmação) e devolve a chave em claro + a URI otpauth:// pro QR. É a única resposta que
// carrega o segredo fora do banco cifrado.
export const registrarTotp = async (): Promise<RegistrarTotpResponse> => {
  const { data } = await httpClient.post<RegistrarTotpResponse>('/auth/totp/registrar')
  return data
}
