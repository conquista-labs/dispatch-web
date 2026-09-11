import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ALCANCE_QUERY_KEY } from '@/entities/conferente'
import { REGRAS_ALCADA_QUERY_KEY, type RegraAlcada } from '@/entities/regraAlcada'

import { alterarStatusRegraAlcada } from '../api/alterar-status-regra-alcada'

export const useAlterarStatusRegraAlcada = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: alterarStatusRegraAlcada,
    // Mesmo raciocínio de useRemoverRegraAlcada — atualiza o cache direto, não só invalidate
    // (achado em produção: o refetch em background pode demorar mais que o esperado).
    onSuccess: (_dados, { regraId, ativa }) => {
      queryClient.setQueryData<RegraAlcada[]>(REGRAS_ALCADA_QUERY_KEY, (atual) =>
        atual?.map((regra) => (regra.id === regraId ? { ...regra, ativa } : regra)),
      )
      queryClient.invalidateQueries({ queryKey: REGRAS_ALCADA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ALCANCE_QUERY_KEY })
    },
  })
}
