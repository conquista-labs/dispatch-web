import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY, VISAO_DISTRIBUICAO_QUERY_KEY } from '@/entities/protocolo'

import { definirObservacao } from '../api/definir-observacao'

// Usado por Minha fila (RF-23, dono editando o próprio) e Distribuição (RF-15, gestão editando
// qualquer um) — invalida as duas queries porque não sabe de onde foi chamado.
export const useDefinirObservacao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: definirObservacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: VISAO_DISTRIBUICAO_QUERY_KEY })
    },
  })
}
