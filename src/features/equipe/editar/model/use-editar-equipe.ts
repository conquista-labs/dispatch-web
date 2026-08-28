import { useMutation, useQueryClient } from '@tanstack/react-query'

import { EQUIPES_QUERY_KEY } from '@/entities/equipe'
import { VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { editarEquipe } from '../api/editar-equipe'

export const useEditarEquipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: editarEquipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EQUIPES_QUERY_KEY })
      // RF-38: mudar o prazo recalcula vencimento dos protocolos abertos da equipe — o
      // semáforo de Distribuição/Minha fila muda junto.
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
