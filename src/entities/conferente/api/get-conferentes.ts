import { httpClient } from '@/shared/api/http-client'

import type { Conferente } from '../model/types'

// GET /conferentes (RF-25) — junta Conferente + Usuario.Nome no back, pra qualquer tela que só
// tem conferenteId conseguir mostrar quem é.
export const getConferentes = async (): Promise<Conferente[]> => {
  const { data } = await httpClient.get<Conferente[]>('/conferentes')
  return data
}
