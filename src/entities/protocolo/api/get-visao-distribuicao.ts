import { httpClient } from '@/shared/api/http-client'

import type { VisaoDistribuicao } from '../model/types'

// GET /protocolos/distribuicao (RF-13) — loteImportacaoId opcional, sem ele mostra tudo que já
// existiu (não só de um lote).
export const getVisaoDistribuicao = async (loteImportacaoId?: string): Promise<VisaoDistribuicao> => {
  const { data } = await httpClient.get<VisaoDistribuicao>('/protocolos/distribuicao', {
    params: loteImportacaoId ? { loteImportacaoId } : undefined,
  })
  return data
}
