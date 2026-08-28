import { httpClient } from '@/shared/api/http-client'

export type AlterarStatusRegraAlcadaRequest = {
  regraId: string
  ativa: boolean
}

// POST /regras-alcada/{id}/ativar | /desativar (RF-33).
export const alterarStatusRegraAlcada = async ({ regraId, ativa }: AlterarStatusRegraAlcadaRequest): Promise<void> => {
  await httpClient.post(`/regras-alcada/${regraId}/${ativa ? 'ativar' : 'desativar'}`)
}
