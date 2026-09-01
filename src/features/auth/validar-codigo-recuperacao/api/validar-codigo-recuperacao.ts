import { httpClient } from '@/shared/api/http-client'

export type ValidarCodigoRecuperacaoRequest = {
  email: string
  codigo: string
}

export type ValidarCodigoRecuperacaoResponse = {
  tokenRecuperacao: string
}

// POST /auth/recuperar/validar-codigo (RF-01g etapa 2 / RF-01i) — anônimo. 200 com o token de
// recuperação (uso único, 10 minutos); 401 código inválido (mesma resposta pra e-mail
// inexistente/sem TOTP confirmado, RF-01h); 423 conta bloqueada (5 tentativas erradas).
export const validarCodigoRecuperacao = async (
  request: ValidarCodigoRecuperacaoRequest,
): Promise<ValidarCodigoRecuperacaoResponse> => {
  const { data } = await httpClient.post<ValidarCodigoRecuperacaoResponse>('/auth/recuperar/validar-codigo', request, {
    ignorarSessaoEncerrada: true,
  })
  return data
}
