import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ALCANCE_QUERY_KEY } from '@/entities/conferente'
import { EQUIPES_QUERY_KEY } from '@/entities/equipe'
import { ESCREVENTES_QUERY_KEY, ESCREVENTES_SEM_EQUIPE_QUERY_KEY } from '@/entities/escrevente'
import { REGRAS_ALCADA_QUERY_KEY } from '@/entities/regraAlcada'
import { SUGESTOES_HISTORICO_QUERY_KEY, SUGESTOES_PENDENTES_QUERY_KEY } from '@/entities/sugestao'
import { TIPOS_ATO_QUERY_KEY } from '@/entities/tipoAto'

import { aplicarSugestao } from '../api/aplicar-sugestao'

// RF-40: "aplicar" pode classificar um tipo de ato, mudar prazo de equipe, alocar escrevente
// ou criar regra de alçada — não dá pra saber qual, então invalida os quatro domínios junto
// com a fila de sugestões (mais amplo que o normal do projeto, mas o alvo real muda por tipo).
export const useAplicarSugestao = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: aplicarSugestao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUGESTOES_PENDENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SUGESTOES_HISTORICO_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: REGRAS_ALCADA_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ALCANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: EQUIPES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ESCREVENTES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ESCREVENTES_SEM_EQUIPE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: TIPOS_ATO_QUERY_KEY })
    },
  })
}
