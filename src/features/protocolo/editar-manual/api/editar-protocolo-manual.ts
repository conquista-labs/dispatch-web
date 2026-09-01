import { httpClient } from '@/shared/api/http-client'

import type { Etapa, Prioridade } from '@/entities/protocolo'

export type EditarProtocoloManualParams = {
  id: string
  tipoAtoId: string
  escreventeNome: string
  etapa: Etapa
  prioridade: Prioridade
  observacao: string | null
}

// PUT /protocolos/{id} (RF-18g/h) — trocar tipo/escrevente/etapa recalcula prazo; dono que
// perde alçada volta ao pool sozinho, no back.
export const editarProtocoloManual = async ({ id, ...body }: EditarProtocoloManualParams): Promise<void> => {
  await httpClient.put(`/protocolos/${id}`, body)
}
