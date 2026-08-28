import { httpClient } from '@/shared/api/http-client'

export type MarcarPresencaRequest = {
  conferenteId: string
  presente: boolean
}

// POST /conferentes/{id}/presenca (RF-27) — marcar ausente devolve pro pool os protocolos que
// essa pessoa tinha atribuídos, na hora (o back já faz isso, o front só invalida as duas telas).
export const marcarPresenca = async ({ conferenteId, presente }: MarcarPresencaRequest): Promise<void> => {
  await httpClient.post(`/conferentes/${conferenteId}/presenca`, { presente })
}
