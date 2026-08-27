import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'

export const LogoutButton = () => {
  const clearSession = useSessionStore((state) => state.clearSession)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    // Sem isso, o cache do TanStack Query (usuario-atual, minha-fila, protocolos-distribuicao,
    // conferentes...) sobrevive ao logout — o próximo login reaproveita dado em cache do
    // usuário anterior por uma fração de segundo (SessionBoot sincroniza esse dado velho de
    // volta pra store), até os refetches chegarem. Bug real, achado em uso: deslogar de
    // Distribuidora e logar como Conferente mostrava a sessão de Distribuidora primeiro.
    queryClient.clear()
    navigate(ROUTES.login)
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-text-2 hover:bg-secondary hover:text-foreground"
    >
      Sair
    </button>
  )
}
