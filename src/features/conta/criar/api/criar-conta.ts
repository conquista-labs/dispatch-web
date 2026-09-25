import type { PapelDeConta } from '@/entities/conta'
import { httpClient } from '@/shared/api/http-client'

export type CriarContaRequest = {
  nome: string
  email: string
  senhaInicial: string
  papel: PapelDeConta
}

// POST /contas (RF-45) — 201 cria a conta, que troca a senha no primeiro acesso; 400 dados
// inválidos ou senha inicial com menos de 8; 409 e-mail já cadastrado.
export const criarConta = async (request: CriarContaRequest): Promise<{ usuarioId: string }> => {
  const { data } = await httpClient.post<{ usuarioId: string }>('/contas', request)
  return data
}
