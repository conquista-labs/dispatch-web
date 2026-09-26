import { httpClient } from '@/shared/api/http-client'

import type { FaixasSemaforo } from '../lib/legenda-prazo'
import type { ProtocoloResumo } from '../model/types'

// Regra do pool (dispatch-api, decisão do dono 2026-09-26): o conferente pega na ordem da fila
// (prioridade alta, depois vencimento) e até um limite de atos na mão (atribuídos + em
// conferência). `proximoId` é o único que ele pode pegar quando a ordem é obrigatória; null quando
// já está no limite.
export type RegraDoPool = {
  ordemObrigatoria: boolean
  limiteNaMao: number
  naMao: number
  proximoId: string | null
}

export type MinhaFila = {
  poolDisponivel: ProtocoloResumo[]
  atribuidos: ProtocoloResumo[]
  emConferencia: ProtocoloResumo[]
  /** Opcional: a API anterior não manda (o front sobe depois da API, mas o cache pode ser velho). */
  faixas?: FaixasSemaforo
  /** Opcional pelo mesmo motivo; sem ela, qualquer card do pool pode ser pego (comportamento anterior). */
  regraDoPool?: RegraDoPool
}

// GET /minha-fila (RF-19) — as 3 colunas do conferente, pool já filtrado pela alçada dele.
export const getMinhaFila = async (): Promise<MinhaFila> => {
  const { data } = await httpClient.get<MinhaFila>('/minha-fila')
  return data
}
