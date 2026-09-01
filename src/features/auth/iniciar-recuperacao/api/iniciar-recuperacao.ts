import { httpClient } from '@/shared/api/http-client'

export type IniciarRecuperacaoRequest = {
  email: string
}

// POST /auth/recuperar/iniciar (RF-01g etapa 1 / RF-01h) — anônimo, sempre 200, e-mail
// existindo ou não (anti-enumeração).
export const iniciarRecuperacao = async (request: IniciarRecuperacaoRequest): Promise<void> => {
  await httpClient.post('/auth/recuperar/iniciar', request)
}
