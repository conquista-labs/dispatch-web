import { httpClient } from '@/shared/api/http-client'

export type DefinirTempoReferenciaRequest = {
  tipoAtoId: string
  // null = deixa de informar e volta a usar o histórico (ou a estimativa, sem histórico).
  minutos: number | null
}

// PUT /tipos-ato/{id}/tempo-referencia (RF-46c) — só Administrador.
export const definirTempoReferencia = async ({ tipoAtoId, minutos }: DefinirTempoReferenciaRequest): Promise<void> => {
  await httpClient.put(`/tipos-ato/${tipoAtoId}/tempo-referencia`, { minutos })
}
