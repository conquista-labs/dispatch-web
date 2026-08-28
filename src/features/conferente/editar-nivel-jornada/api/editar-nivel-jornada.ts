import { httpClient } from '@/shared/api/http-client'
import type { Nivel } from '@/entities/conferente'

export type EditarNivelEJornadaRequest = {
  conferenteId: string
  nivel: Nivel
  jornadaHoras: number
}

// PUT /conferentes/{id}/nivel-jornada (RF-25/RF-26).
export const editarNivelEJornada = async ({ conferenteId, nivel, jornadaHoras }: EditarNivelEJornadaRequest): Promise<void> => {
  await httpClient.put(`/conferentes/${conferenteId}/nivel-jornada`, { nivel, jornadaHoras })
}
