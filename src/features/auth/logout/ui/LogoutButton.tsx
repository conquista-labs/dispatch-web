import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'

type LogoutButtonProps = {
  // Default cobre o rodapé da sidebar (bloco de largura total, alinhado à esquerda) — a barra
  // superior mobile (RNF-13) passa uma classe compacta, não faz sentido "Sair" ocupar a largura
  // toda ao lado do toggle de tema.
  className?: string
}

export const LogoutButton = ({ className }: LogoutButtonProps = {}) => {
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
      className={cn(
        'w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-text-2 hover:bg-secondary hover:text-foreground',
        className,
      )}
    >
      Sair
    </button>
  )
}
