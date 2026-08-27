import { Outlet } from 'react-router-dom'

import { useSessionStore } from '@/entities/usuario'
import { LogoutButton } from '@/features/auth/logout'

// Composição de features + entities pra formar um bloco de UI maior — todo widget compõe
// coisas de baixo, nunca conhece pages (que ficam acima dele na hierarquia do FSD).
export const AppShell = () => {
  const usuario = useSessionStore((state) => state.usuario)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
        <span className="text-sm font-semibold text-zinc-900">Dispatch</span>
        <div className="flex items-center gap-4">
          {usuario && (
            <span className="text-sm text-zinc-500">
              {usuario.nome} · {usuario.papel}
            </span>
          )}
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
