import { httpClient } from '@/shared/api/http-client'

// POST /sugestoes/{id}/aplicar (RF-40) — executa a mudança de verdade: classifica tipo, muda
// prazo, aloca escrevente ou cria regra de alçada, dependendo do tipo da sugestão.
export const aplicarSugestao = async (sugestaoId: string): Promise<void> => {
  await httpClient.post(`/sugestoes/${sugestaoId}/aplicar`)
}
