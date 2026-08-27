import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { type Papel, roleHomeRoute, useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'

type RequireRoleProps = {
  roles: Papel[]
  children: ReactNode
}

// Guarda de rota por papel — a garantia de verdade continua sendo o servidor (RNF-04), isso
// só evita que a UI errada apareça pra quem não devia ver. Adicionar um papel novo (ex.:
// Subscritor) é só uma rota nova com a lista de `roles` certa — nada aqui muda.
export const RequireRole = ({ roles, children }: RequireRoleProps) => {
  const usuario = useSessionStore((state) => state.usuario)

  if (!usuario) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (!roles.includes(usuario.papel)) {
    return <Navigate to={roleHomeRoute[usuario.papel]} replace />
  }

  return <>{children}</>
}
