import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/{id}/pausar — 204; 409 se não for seu/não estiver em conferência, ou já
// estiver pausado. Continua contando pro limite de simultâneos (RF-21) — só congela o cronômetro.
export const pausarConferencia = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/minha-fila/${protocoloId}/pausar`)
}
