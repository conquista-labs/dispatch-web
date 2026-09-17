import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/{id}/retomar — 204; 409 se não for seu/não estiver em conferência, ou não
// estiver pausado. Abre um ciclo novo a partir de agora (o tempo pausado não conta).
export const retomarConferencia = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/minha-fila/${protocoloId}/retomar`)
}
