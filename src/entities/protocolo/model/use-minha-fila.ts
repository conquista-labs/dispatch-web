import { useQuery } from '@tanstack/react-query'

import { getMinhaFila } from '../api/get-minha-fila'

// Chave exportada pra features/ invalidarem depois de pegar/iniciar/concluir/reprovar —
// mesma ideia de sempre: quem muda o dado invalida, quem lê só assina a query.
export const MINHA_FILA_QUERY_KEY = ['minha-fila']

// RF-24i — a fila se atualiza sozinha a cada 30s (além do refetch no focus/mount), pra que um
// protocolo marcado como prioridade alta pela distribuidora apareça enquanto a conferente está
// trabalhando. Só com a aba visível: em segundo plano o polling pausa e o refetch no focus cobre a
// volta. Sem SignalR/SSE — infraestrutura nova só pra isso, e 30s basta (PLANO-melhorias, Feature 2).
export const INTERVALO_ATUALIZACAO_FILA_MS = 30_000

export const useMinhaFila = () =>
  useQuery({
    queryKey: MINHA_FILA_QUERY_KEY,
    queryFn: getMinhaFila,
    refetchInterval: INTERVALO_ATUALIZACAO_FILA_MS,
    refetchIntervalInBackground: false,
  })
