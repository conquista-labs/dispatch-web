import type { TipoPrazo } from '@/entities/protocolo'
import { httpClient } from '@/shared/api/http-client'

export type EditarEquipeRequest = {
  equipeId: string
  nome: string
  prazoPreConferencia: TipoPrazo
  prazoPosConferencia: TipoPrazo
}

// PUT /equipes/{id} (RF-35/RF-36) — renomear e/ou trocar prazo. O back recalcula sozinho o
// vencimento dos protocolos abertos dessa equipe (RF-38); o front só invalida cache.
export const editarEquipe = async ({ equipeId, ...body }: EditarEquipeRequest): Promise<void> => {
  await httpClient.put(`/equipes/${equipeId}`, body)
}
