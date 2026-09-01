import { useQuery } from '@tanstack/react-query'

import { testarAlcada } from '../api/testar-alcada'
import type { TestarAlcadaRequest } from './types'

// `caso` nulo (ainda sem tipo escolhido no simulador) desliga a busca — não tem o que testar.
export const useTestarAlcada = (caso: TestarAlcadaRequest | null) =>
  useQuery({
    queryKey: ['regras-alcada', 'testar', caso],
    queryFn: () => testarAlcada(caso!),
    enabled: caso !== null,
  })
