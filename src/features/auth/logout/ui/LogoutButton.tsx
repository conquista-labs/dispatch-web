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
    <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-zinc-900">
      Sair
    </button>
  )
}
