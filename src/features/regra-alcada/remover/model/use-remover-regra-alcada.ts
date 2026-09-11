import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ALCANCE_QUERY_KEY } from '@/entities/conferente'
import { REGRAS_ALCADA_QUERY_KEY, type RegraAlcada } from '@/entities/regraAlcada'

import { removerRegraAlcada } from '../api/remover-regra-alcada'

export const useRemoverRegraAlcada = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removerRegraAlcada,
    // Atualiza o cache direto (não só invalidateQueries) — achado em produção: o refetch em
    // background que o invalidate dispara pode demorar/não completar a tempo (infra do Render
    // free tier), e sem isso a tela ficava parecendo "não fez nada" mesmo com o delete já
    // persistido no banco (confirmado recarregando a página). Tirar a regra do cache na hora
    // não depende de round-trip nenhum — já sabemos que deu certo (a mutação não teria chamado
    // onSuccess se o back tivesse rejeitado).
    onSuccess: (_dados, regraId) => {
      queryClient.setQueryData<RegraAlcada[]>(REGRAS_ALCADA_QUERY_KEY, (atual) =>
        atual?.filter((regra) => regra.id !== regraId),
      )
      queryClient.invalidateQueries({ queryKey: REGRAS_ALCADA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ALCANCE_QUERY_KEY })
    },
  })
}
