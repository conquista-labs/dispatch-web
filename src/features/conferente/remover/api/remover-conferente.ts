import { httpClient } from '@/shared/api/http-client'

// DELETE /conferentes/{id} (RF-25) — soft delete: desativa o usuário e tira da escala, não
// apaga a linha. Também devolve pro pool os protocolos que a pessoa tinha (RF-27).
export const removerConferente = async (conferenteId: string): Promise<void> => {
  await httpClient.delete(`/conferentes/${conferenteId}`)
}
