import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/{id}/iniciar (RF-21) — 204; 409 se não for seu/não atribuído, ou se o
// limite de atos simultâneos já foi atingido.
export const iniciarConferencia = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/minha-fila/${protocoloId}/iniciar`)
}
