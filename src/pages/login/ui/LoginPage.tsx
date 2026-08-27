import { Navigate } from 'react-router-dom'

import { roleHomeRoute, useSessionStore } from '@/entities/usuario'
import { LoginForm } from '@/features/auth/login'
import { Logo } from '@/shared/ui/logo'

// Layout fiel ao protótipo aprovado (../dispatch-prototype/Dispatch.dc.html, tela de login):
// painel esquerdo 44%, sempre escuro (não acompanha claro/escuro do app — é vitrine de marca,
// não chrome funcional), painel direito com o formulário, esse sim seguindo o tema.
const LEGENDA = [
  { label: 'no prazo', bg: '#f0fdf4', border: '#86efac' },
  { label: 'atenção', bg: '#fef9c3', border: '#facc15' },
  { label: 'estourado', bg: '#fee2e2', border: '#f87171' },
]

export const LoginPage = () => {
  const usuario = useSessionStore((state) => state.usuario)

  if (usuario) {
    return <Navigate to={roleHomeRoute[usuario.papel]} replace />
  }

  return (
    <div className="flex min-h-screen items-stretch">
      <div className="flex w-[44%] flex-none flex-col justify-between border-r border-border bg-zinc-950 px-12 py-11 text-zinc-50">
        <div className="flex items-center gap-3">
          <Logo variant="on-dark-fixed" size="lg" />
          <span className="text-[21px] font-semibold tracking-[-0.02em]">Dispatch</span>
        </div>

        <div>
          <h2 className="m-0 max-w-[15em] text-[30px] leading-[1.15] font-semibold tracking-[-0.025em] text-balance">
            A fila de conferência do cartório, distribuída sozinha.
          </h2>
          <p className="mt-3.5 max-w-[26em] text-[14.5px] leading-normal text-zinc-400 text-pretty">
            Cada ato vai para quem tem alçada para ele, na ordem do prazo. O que estoura aparece em vermelho antes de virar problema.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-zinc-500">
          {LEGENDA.map((item) => (
            <span key={item.label} className="ml-1.5 flex items-center gap-1.5 first:ml-0">
              <span className="block size-2.5 flex-none rounded-[3px] border" style={{ background: item.bg, borderColor: item.border }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-card p-10">
        <div className="w-full max-w-[352px]">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Entrar</h1>
          <p className="mt-1.5 mb-6 text-[13.5px] text-muted-foreground">Use o acesso do cartório.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
