import { useQuery } from '@tanstack/react-query'

import { getPainelDeHoje } from '../api/get-painel-de-hoje'

export const PAINEL_DE_HOJE_QUERY_KEY = ['dashboard', 'hoje']

// "Hoje, agora" é o retrato do momento — atualiza sozinho a cada minuto enquanto a aba está visível
// (o "atualizado às HH:MM" do cabeçalho mostra de quando é o número).
export const usePainelDeHoje = () =>
  useQuery({
    queryKey: PAINEL_DE_HOJE_QUERY_KEY,
    queryFn: getPainelDeHoje,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
