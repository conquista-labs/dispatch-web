import { httpClient } from '@/shared/api/http-client'

export type ConcluirConferenciaRequest = {
  protocoloId: string
  aprovado: boolean
}

// POST /minha-fila/{id}/concluir (RF-22) — aprova ou reprova, encerra o cronômetro.
export const concluirConferencia = async ({ protocoloId, aprovado }: ConcluirConferenciaRequest): Promise<void> => {
  await httpClient.post(`/minha-fila/${protocoloId}/concluir`, { aprovado })
}
