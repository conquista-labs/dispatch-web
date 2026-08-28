import { httpClient } from '@/shared/api/http-client'

// POST /sugestoes/gerar — roda o "job diário" sob demanda (RF-39).
export const gerarSugestoes = async (): Promise<{ novasSugestoes: number }> => {
  const { data } = await httpClient.post<{ novasSugestoes: number }>('/sugestoes/gerar')
  return data
}
