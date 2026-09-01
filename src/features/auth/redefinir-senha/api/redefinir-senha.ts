import { httpClient } from '@/shared/api/http-client'

export type RedefinirSenhaRequest = {
  tokenRecuperacao: string
  novaSenha: string
}

// POST /auth/recuperar/redefinir-senha (RF-01g etapa 3 / RF-01j / RF-01k) — anônimo. 204 troca
// a senha, encerra todas as sessões e devolve pro pool os atos em conferência; 400 senha fraca;
// 401 token inválido/expirado/já usado.
export const redefinirSenha = async (request: RedefinirSenhaRequest): Promise<void> => {
  await httpClient.post('/auth/recuperar/redefinir-senha', request, { ignorarSessaoEncerrada: true })
}
