import { httpClient } from '@/shared/api/http-client'

import type { Etapa, Prioridade, SimulacaoProtocolo } from '../model/types'

export type SimularProtocoloManualParams = {
  numero: string
  tipoAtoId: string
  escreventeNome: string
  etapa: Etapa
  prioridade: Prioridade
}

// POST /protocolos/manual/simular (RF-18f) — prévia sem persistir, chamada ao vivo enquanto o
// formulário do modal é preenchido.
export const simularProtocoloManual = async (params: SimularProtocoloManualParams): Promise<SimulacaoProtocolo> => {
  const { data } = await httpClient.post<SimulacaoProtocolo>('/protocolos/manual/simular', params)
  return data
}
