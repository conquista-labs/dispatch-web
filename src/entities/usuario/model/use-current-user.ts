import { useQuery } from '@tanstack/react-query'

import { getCurrentUser } from '../api/get-current-user'
import { useSessionStore } from './session-store'

// Só dispara quando existe um token persistido — sem token, não tem o que revalidar (é o
// caso normal de "ainda não logou", não um erro). Chamado uma vez no boot do app (ver
// app/routing) pra decidir se a sessão guardada ainda é válida antes de liberar as rotas.
export const useCurrentUser = () => {
  const token = useSessionStore((state) => state.token)

  return useQuery({
    queryKey: ['usuario-atual'],
    queryFn: getCurrentUser,
    enabled: !!token,
    retry: false,
  })
}
