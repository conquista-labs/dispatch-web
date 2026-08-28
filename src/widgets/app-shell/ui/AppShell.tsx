import { NavLink, Outlet } from 'react-router-dom'

import { type Papel, useSessionStore } from '@/entities/usuario'
import { LogoutButton } from '@/features/auth/logout'
import { ROUTES } from '@/shared/config/routes'
import { useThemeStore } from '@/shared/lib/theme-store'
import { Logo } from '@/shared/ui/logo'

// RF-25 a RF-46 vão crescer essa lista por papel — Distribuidora ganha mais itens conforme
// as telas de gestão nascem (Conferentes, Central de regras, Dashboard...).
const NAV_POR_PAPEL: Record<Papel, { label: string; to: string }[]> = {
  Distribuidora: [
    { label: 'Distribuição', to: ROUTES.distribuicao },
    { label: 'Importar', to: ROUTES.importar },
    // RF-19: protótipo aprovado tem "Minha fila" no menu de quem é gestão também — mesmo
    // rótulo, ordem do protótipo (entre Importar e Conferentes); o conteúdo é diferente
    // (ROUTES.filaConferentes: escolhe um conferente, vê a fila dele em leitura).
    { label: 'Minha fila', to: ROUTES.filaConferentes },
    { label: 'Conferentes', to: ROUTES.conferentes },
  ],
  Conferente: [{ label: 'Minha fila', to: ROUTES.minhaFila }],
}

// Layout fiel ao protótipo aprovado (../dispatch-prototype/Dispatch.dc.html) — sidebar de
// 224px, marca no topo, navegação por papel, sessão fixada embaixo.
export const AppShell = () => {
  const usuario = useSessionStore((state) => state.usuario)
  const tema = useThemeStore((state) => state.tema)
  const toggleTema = useThemeStore((state) => state.toggleTema)

  const itensNav = usuario ? NAV_POR_PAPEL[usuario.papel] : []

  return (
    <div className="flex min-h-screen items-stretch">
      <aside className="flex w-56 flex-none flex-col border-r border-border bg-card py-4">
        <div className="flex items-center gap-2 px-4 pb-4">
          <Logo size="sm" />
          <span className="text-[14.5px] font-semibold tracking-[-0.01em]">Dispatch</span>
        </div>

        <div className="px-4 pb-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">Operação</div>
        <nav className="flex flex-col gap-px px-2">
          {itensNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 text-left text-[13.5px] transition-colors hover:bg-secondary hover:text-foreground ${
                  isActive ? 'bg-secondary font-semibold text-foreground' : 'font-normal text-text-3'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-border px-4 pt-3">
          <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">Sessão</div>

          {usuario && (
            <div className="flex items-center justify-between gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px]">
              <span className="truncate">{usuario.nome}</span>
              <span className="flex-none text-[11px] text-muted-foreground">{usuario.papel}</span>
            </div>
          )}

          <button
            onClick={toggleTema}
            className="mt-1.5 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-text-2 hover:bg-secondary hover:text-foreground"
          >
            <span
              className="block size-3 flex-none rounded-full border-[1.5px] border-current"
              style={{ background: 'linear-gradient(90deg, currentColor 50%, transparent 50%)' }}
            />
            <span className="flex-1">{tema === 'dark' ? 'Escuro' : 'Claro'}</span>
            <span className="text-[11px] text-muted-foreground">trocar</span>
          </button>

          <div className="mt-0.5">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
