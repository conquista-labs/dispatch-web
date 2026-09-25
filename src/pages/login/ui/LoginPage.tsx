import { Navigate } from 'react-router-dom'

import { roleHomeRoute, useSessionStore } from '@/entities/usuario'
import { LoginForm } from '@/features/auth/login'
import { ROUTES } from '@/shared/config/routes'
import { Logo } from '@/shared/ui/logo'

// Layout fiel ao protótipo aprovado (Dispatch v2, tela de login): dois painéis de `flex: 1 1 420px`
// com quebra de linha — lado a lado no desktop, empilhados no celular (o layout antigo, com o painel
// escuro fixo em 44% e sem quebra, espremia as duas colunas a 390px). O painel escuro é sempre
// escuro (vitrine de marca, não chrome funcional); o do formulário segue o tema.
const LEGENDA = [
  { label: 'no prazo', bg: '#f0fdf4', border: '#86efac' },
  { label: 'atenção', bg: '#fef9c3', border: '#facc15' },
  { label: 'estourado', bg: '#fee2e2', border: '#f87171' },
]

export const LoginPage = () => {
  const usuario = useSessionStore((state) => state.usuario)

  if (usuario) {
    return <Navigate to={usuario.trocarSenha ? ROUTES.trocarSenha : roleHomeRoute[usuario.papeis[0]]} replace />
  }

  return (
    <div className="flex min-h-screen flex-wrap items-stretch">
      <div className="flex min-w-0 flex-[1_1_420px] flex-col justify-between gap-9 border-r border-border bg-zinc-950 px-[clamp(28px,3.4vw,48px)] py-11 text-zinc-50 max-mobile:border-r-0 max-mobile:border-b">
        <div className="flex items-center gap-3">
          <Logo variant="on-dark-fixed" size="lg" />
          <span className="text-[21px] font-semibold tracking-[-0.02em]">Dispatch</span>
        </div>

        <div>
          <h2 className="m-0 max-w-[15em] text-[clamp(22px,2.5vw,30px)] leading-[1.15] font-semibold tracking-[-0.025em] text-balance">
            A fila de conferência do cartório, distribuída sozinha.
          </h2>
          <p className="mt-3.5 max-w-[30em] text-[14.5px] leading-normal text-pretty text-zinc-400">
            Cada ato vai para quem tem alçada para ele, na ordem do prazo. O que estoura aparece em vermelho antes de
            virar problema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 text-xs text-zinc-500">
          {LEGENDA.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="block size-2.5 flex-none rounded-[3px] border"
                style={{ background: item.bg, borderColor: item.border }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_420px] items-center justify-center bg-card px-[clamp(24px,3vw,40px)] py-10">
        <div className="w-full max-w-[352px]">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Entrar</h1>
          <p className="mt-1.5 mb-6 text-[13.5px] text-muted-foreground">Use o acesso do cartório.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
