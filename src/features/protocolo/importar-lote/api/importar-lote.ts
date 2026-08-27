import { httpClient } from '@/shared/api/http-client'

import type { ImportarLoteRequest, ResumoImportacao } from '../model/types'

// POST /protocolos/importar/pre-visualizar (RF-10/RF-11) — roda a distribuição do lote inteiro
// sem gravar nada.
export const preVisualizarLote = async (request: ImportarLoteRequest): Promise<ResumoImportacao> => {
  const { data } = await httpClient.post<ResumoImportacao>('/protocolos/importar/pre-visualizar', request)
  return data
}

// POST /protocolos/importar/confirmar (RF-12) — mesma distribuição, agora grava.
export const confirmarLote = async (request: ImportarLoteRequest): Promise<ResumoImportacao> => {
  const { data } = await httpClient.post<ResumoImportacao>('/protocolos/importar/confirmar', request)
  return data
}
