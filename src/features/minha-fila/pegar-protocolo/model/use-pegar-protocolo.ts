import { useMutation, useQueryClient } from '@tanstack/react-query'

import { MINHA_FILA_QUERY_KEY } from '@/entities/protocolo'

import { pegarProtocolo } from '../api/pegar-protocolo'

export const usePegarProtocolo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pegarProtocolo,
    // onSettled, não onSuccess: um 409 (fora da vez, limite na mão, outro conferente pegou antes)
    // também muda a fila — sem recarregar, o botão ficaria no card que já não é o da vez.
    onSettled: () => queryClient.invalidateQueries({ queryKey: MINHA_FILA_QUERY_KEY }),
  })
}
