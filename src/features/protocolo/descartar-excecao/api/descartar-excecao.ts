import { httpClient } from '@/shared/api/http-client'

// POST /protocolos/{id}/descartar (RF-17) — descarta uma exceção sem resolver.
export const descartarExcecao = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/descartar`)
}
