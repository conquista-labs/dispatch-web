import { useQuery } from '@tanstack/react-query'

import { getMinhaFila } from '../api/get-minha-fila'

// Chave exportada pra features/ invalidarem depois de pegar/iniciar/concluir/reprovar —
// mesma ideia de sempre: quem muda o dado invalida, quem lê só assina a query.
export const MINHA_FILA_QUERY_KEY = ['minha-fila']

// Sem staleTime alto de propósito — fila de protocolo muda o tempo todo (outro conferente
// pode pegar do pool, prazo anda), refetch no focus/mount é o comportamento certo aqui.
export const useMinhaFila = () =>
  useQuery({
    queryKey: MINHA_FILA_QUERY_KEY,
    queryFn: getMinhaFila,
  })
