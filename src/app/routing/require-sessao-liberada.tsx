import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'

// Envolve o AppShell inteiro, não cada rota: sem sessão vai pro login, e com a troca de senha
// inicial pendente (RF-45) vai pra /trocar-senha antes de o shell montar e disparar as queries
// de menu — que o back recusaria com 403 enquanto a senha não for trocada (dispatch-api ADR-0040).
export const RequireSessaoLiberada = ({ children }: { children: ReactNode }) => {
  const usuario = useSessionStore((state) => state.usuario)

  if (!usuario) return <Navigate to={ROUTES.login} replace />
  if (usuario.trocarSenha) return <Navigate to={ROUTES.trocarSenha} replace />

  return children
}
