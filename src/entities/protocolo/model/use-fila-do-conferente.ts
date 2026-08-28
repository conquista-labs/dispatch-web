import { useQuery } from '@tanstack/react-query'

import { getFilaDoConferente } from '../api/get-fila-do-conferente'
import { getConcluidosHojeDoConferente } from '../api/get-concluidos-hoje-do-conferente'

// Chave com o id embutido — cada conferente tem sua própria fila em cache, não uma query só
// que troca de dono por baixo (mesmo raciocínio de escopo por usuário de outras telas).
export const filaDoConferenteQueryKey = (conferenteId: string) => ['conferentes', conferenteId, 'fila']
export const concluidosHojeDoConferenteQueryKey = (conferenteId: string) => ['conferentes', conferenteId, 'concluidos-hoje']

export const useFilaDoConferente = (conferenteId: string) =>
  useQuery({
    queryKey: filaDoConferenteQueryKey(conferenteId),
    queryFn: () => getFilaDoConferente(conferenteId),
  })

export const useConcluidosHojeDoConferente = (conferenteId: string) =>
  useQuery({
    queryKey: concluidosHojeDoConferenteQueryKey(conferenteId),
    queryFn: () => getConcluidosHojeDoConferente(conferenteId),
  })
