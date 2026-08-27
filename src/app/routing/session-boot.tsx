import { type PropsWithChildren, useEffect } from 'react'

import { useCurrentUser, useSessionStore } from '@/entities/usuario'

// No boot, se existe um token persistido (F5, aba nova), revalida contra o GET /auth/me antes
// de liberar as rotas privadas — nunca confia cegamente no que estava salvo. Enquanto isso
// corre, segura a renderização; se o token era inválido, o interceptor 401
// (shared/api/http-client) já limpou a sessão e o usuário cai pra tela de login sozinho.
export const SessionBoot = ({ children }: PropsWithChildren) => {
  const token = useSessionStore((state) => state.token)
  const setSession = useSessionStore((state) => state.setSession)
  const { data, isLoading } = useCurrentUser()

  useEffect(() => {
    if (data && token) {
      setSession(token, data)
    }
  }, [data, token, setSession])

  if (token && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Carregando…
      </div>
    )
  }

  return <>{children}</>
}
