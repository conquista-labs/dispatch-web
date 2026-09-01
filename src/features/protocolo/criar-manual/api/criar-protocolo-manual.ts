import { httpClient } from '@/shared/api/http-client'

import type { Etapa, Prioridade, ResultadoDistribuicaoProtocolo } from '@/entities/protocolo'

export type CriarProtocoloManualParams = {
  numero: string
  tipoAtoId: string
  escreventeNome: string
  etapa: Etapa
  prioridade: Prioridade
  observacao: string | null
}

// POST /protocolos/manual (RF-18f) — 409 se o número já existir (o front trata via
// mutation.error, mesmo padrão de qualquer outra mutation do projeto).
export const criarProtocoloManual = async (params: CriarProtocoloManualParams): Promise<ResultadoDistribuicaoProtocolo> => {
  const { data } = await httpClient.post<ResultadoDistribuicaoProtocolo>('/protocolos/manual', params)
  return data
}
