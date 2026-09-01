import { httpClient } from '@/shared/api/http-client'

import type { TestarAlcadaRequest, TestarAlcadaResponse } from '../model/types'

// POST /regras-alcada/testar — simulador "Testar" da aba Alçada (Motor v3). É leitura (não
// muda nada), mas vai por POST porque o "caso" (etapa + tipo + equipe) é um corpo, não um
// filtro simples de query string.
export const testarAlcada = async (request: TestarAlcadaRequest): Promise<TestarAlcadaResponse> => {
  const { data } = await httpClient.post<TestarAlcadaResponse>('/regras-alcada/testar', request)
  return data
}
