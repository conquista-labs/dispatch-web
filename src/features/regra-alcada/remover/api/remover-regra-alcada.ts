import { httpClient } from '@/shared/api/http-client'

// DELETE /regras-alcada/{id} (RF-33).
export const removerRegraAlcada = async (regraId: string): Promise<void> => {
  await httpClient.delete(`/regras-alcada/${regraId}`)
}
