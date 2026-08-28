import type { CriarRegraAlcadaRequest } from '@/entities/regraAlcada'
import { httpClient } from '@/shared/api/http-client'

// POST /regras-alcada (RF-31) — sujeito/alvo são XOR, validados no back (400/404).
export const criarRegraAlcada = async (request: CriarRegraAlcadaRequest): Promise<{ regraId: string }> => {
  const { data } = await httpClient.post<{ regraId: string }>('/regras-alcada', request)
  return data
}
