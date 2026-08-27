import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'

export const LogoutButton = () => {
  const clearSession = useSessionStore((state) => state.clearSession)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
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
