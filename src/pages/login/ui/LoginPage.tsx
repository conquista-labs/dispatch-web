import { Navigate } from 'react-router-dom'

import { roleHomeRoute, useSessionStore } from '@/entities/usuario'
import { LoginForm } from '@/features/auth/login'

export const LoginPage = () => {
  const usuario = useSessionStore((state) => state.usuario)

  // Já logado (ex.: voltou pra /login na mão) — manda direto pra casa do papel dele, não
  // mostra o formulário de novo.
  if (usuario) {
    return <Navigate to={roleHomeRoute[usuario.papel]} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-lg font-semibold text-zinc-900">Dispatch</h1>
        <LoginForm />
      </div>
    </div>
  )
}
