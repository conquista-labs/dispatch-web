import { httpClient } from '@/shared/api/http-client'

export type CriarEscreventeRequest = {
  nome: string
  equipeId: string | null
}

// POST /escreventes — cadastro manual (complementa o automático que a importação e a criação
// de protocolo manual já fazem; nome sai normalizado pelo back de qualquer jeito).
export const criarEscrevente = async (request: CriarEscreventeRequest): Promise<{ escreventeId: string }> => {
  const { data } = await httpClient.post<{ escreventeId: string }>('/escreventes', request)
  return data
}
