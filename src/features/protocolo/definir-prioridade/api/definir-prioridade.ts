import type { Prioridade } from '@/entities/protocolo'
import { httpClient } from '@/shared/api/http-client'

export type DefinirPrioridadeRequest = {
  protocoloId: string
  prioridade: Prioridade
}

// POST /protocolos/{id}/definir-prioridade — único jeito real de marcar um protocolo como
// urgente hoje (a importação de lote nunca define prioridade alta, ver CLAUDE.md do back).
export const definirPrioridade = async ({ protocoloId, prioridade }: DefinirPrioridadeRequest): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/definir-prioridade`, { prioridade })
}
