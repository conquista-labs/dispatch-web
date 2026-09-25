import { httpClient } from '@/shared/api/http-client'

export type TrocarSenhaRequest = {
  senhaAtual: string
  novaSenha: string
}

export type TrocarSenhaResponse = {
  token: string
}

// POST /auth/trocar-senha (RF-45, dispatch-api ADR-0040) — troca a senha inicial no primeiro
// acesso. 200 devolve um token novo, já sem a marca de troca pendente; 400 com `codigo`
// `senha_atual_incorreta` ou `senha_fraca`.
export const trocarSenha = async (request: TrocarSenhaRequest): Promise<TrocarSenhaResponse> => {
  const { data } = await httpClient.post<TrocarSenhaResponse>('/auth/trocar-senha', request)
  return data
}
