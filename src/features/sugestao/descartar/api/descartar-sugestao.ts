import { httpClient } from '@/shared/api/http-client'

// POST /sugestoes/{id}/descartar (RF-40) — descarte com memória, não reaparece por um tempo.
export const descartarSugestao = async (sugestaoId: string): Promise<void> => {
  await httpClient.post(`/sugestoes/${sugestaoId}/descartar`)
}
