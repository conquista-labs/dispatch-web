import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ESCREVENTES_QUERY_KEY } from '@/entities/escrevente'
import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { criarProtocoloManual } from '../api/criar-protocolo-manual'

export const useCriarProtocoloManual = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarProtocoloManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      // RF-09: o escrevente digitado pode ser novo (criado na hora pelo back, sem equipe) —
      // sem isso, o cache de /escreventes (staleTime 60s) fica sem ele até expirar sozinho, e
      // qualquer tela que resolva nome por id (o próprio modal em modo editar, cards, etc.)
      // mostra "—" até lá.
      queryClient.invalidateQueries({ queryKey: ESCREVENTES_QUERY_KEY })
    },
  })
}
