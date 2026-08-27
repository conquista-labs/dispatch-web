import { httpClient } from '@/shared/api/http-client'

// POST /protocolos/redistribuir-pool (RF-16) — reaplica o motor a todo protocolo sem dono.
export const redistribuirPool = async (): Promise<{ alterados: number }> => {
  const { data } = await httpClient.post<{ alterados: number }>('/protocolos/redistribuir-pool')
  return data
}
