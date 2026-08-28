import { httpClient } from '@/shared/api/http-client'

export type MoverParaEquipeRequest = {
  escreventeId: string
  equipeId: string | null
}

// POST /escreventes/{id}/mover (RF-35/RF-37) — equipeId nulo tira o escrevente da equipe.
export const moverParaEquipe = async ({ escreventeId, equipeId }: MoverParaEquipeRequest): Promise<void> => {
  await httpClient.post(`/escreventes/${escreventeId}/mover`, { equipeId })
}
