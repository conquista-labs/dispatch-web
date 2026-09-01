import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ESCREVENTES_QUERY_KEY } from '@/entities/escrevente'
import { DETALHE_PROTOCOLO_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { editarProtocoloManual } from '../api/editar-protocolo-manual'

export const useEditarProtocoloManual = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: editarProtocoloManual,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DETALHE_PROTOCOLO_QUERY_KEY(id) })
      // RF-09: trocar pra um escrevente novo tem o mesmo efeito colateral de criar — ver
      // use-criar-protocolo-manual.ts.
      queryClient.invalidateQueries({ queryKey: ESCREVENTES_QUERY_KEY })
    },
  })
}
