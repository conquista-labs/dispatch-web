import { NavLink, Outlet } from 'react-router-dom'

import { useVisaoDistribuicao } from '@/entities/protocolo'
import { useSugestoesPendentes } from '@/entities/sugestao'
import { type Papel, useSessionStore } from '@/entities/usuario'
import { LogoutButton } from '@/features/auth/logout'
import { ROUTES } from '@/shared/config/routes'
import { useThemeStore } from '@/shared/lib/theme-store'
import { useIsMobile } from '@/shared/lib/use-is-mobile'
import { cn } from '@/shared/lib/utils'
import { Logo } from '@/shared/ui/logo'

// RF-25 a RF-46 vão crescer essa lista por papel — Distribuidora ganha mais itens conforme
// as telas de gestão nascem (Conferentes, Central de regras, Dashboard...).
const NAV_POR_PAPEL: Record<Papel, { label: string; to: string }[]> = {
  Distribuidora: [
    { label: 'Dashboard', to: ROUTES.dashboard },
    { label: 'Distribuição', to: ROUTES.distribuicao },
    { label: 'Importar', to: ROUTES.importar },
    // RF-19: protótipo aprovado tem "Minha fila" no menu de quem é gestão também — mesmo
    // rótulo, ordem do protótipo (entre Importar e Conferentes); o conteúdo é diferente
    // (ROUTES.filaConferentes: escolhe um conferente, vê a fila dele em leitura).
    { label: 'Minha fila', to: ROUTES.filaConferentes },
    { label: 'Conferentes', to: ROUTES.conferentes },
    { label: 'Central de regras', to: ROUTES.centralDeRegras },
  ],
  Conferente: [
    { label: 'Dashboard', to: ROUTES.dashboard },
    { label: 'Minha fila', to: ROUTES.minhaFila },
  ],
}

// Badge de pílula do menu (RF-13/RF-39) — mesma medida do protótipo (Dispatch.dc.html, `n.badge`):
// JetBrains Mono 11px, padding 1px/6px, borda 1px, cantos totalmente arredondados. Cores próprias
// (não reaproveita o Chip de shared/ui) porque o protótipo usa `var(--text-3)` aqui, um tom mais
// escuro que o `text-muted-foreground` que o Chip usa nos outros lugares da tela.
const NavBadge = ({ texto, tom }: { texto: string; tom: 'neutro' | 'atencao' }) => (
  <span
    className={cn(
      'flex-none rounded-full border px-1.5 py-px font-mono text-[11px] font-medium',
      tom === 'atencao' ? 'border-warn-border bg-warn-bg-2 text-warn-fg' : 'border-border bg-secondary text-text-3',
    )}
  >
    {texto}
  </span>
)

// Layout fiel ao protótipo aprovado (../dispatch-prototype/Dispatch.dc.html) — sidebar de
// 224px, marca no topo, navegação por papel, sessão fixada embaixo.
export const AppShell = () => {
  const usuario = useSessionStore((state) => state.usuario)
  const tema = useThemeStore((state) => state.tema)
  const toggleTema = useThemeStore((state) => state.toggleTema)
  const mobile = useIsMobile()

  const ehDistribuidora = usuario?.papel === 'Distribuidora'
  const { data: visao } = useVisaoDistribuicao({ enabled: ehDistribuidora })
  const { data: sugestoesPendentes } = useSugestoesPendentes({ enabled: ehDistribuidora })

  const itensNav = usuario ? NAV_POR_PAPEL[usuario.papel] : []

  // Mesma regra do protótipo: Distribuição mostra "N exc" (aviso) se tiver alguma exceção
  // aberta, senão o tamanho do pool (neutro), senão nada. Central de regras mostra a fila de
  // aprendizado pendente (RF-39), senão nada.
  const badgeDoItem = (to: string): { texto: string; tom: 'neutro' | 'atencao' } | null => {
    if (to === ROUTES.distribuicao && visao) {
      if (visao.excecoes.length > 0) return { texto: `${visao.excecoes.length} exc`, tom: 'atencao' }
      if (visao.pool.length > 0) return { texto: String(visao.pool.length), tom: 'neutro' }
    }
    if (to === ROUTES.centralDeRegras && sugestoesPendentes && sugestoesPendentes.length > 0) {
      return { texto: String(sugestoesPendentes.length), tom: 'neutro' }
    }
    return null
  }

  // RNF-13 — abaixo de 760px a sidebar dá lugar a uma barra superior fixa + uma tira de chips
  // roláveis (confirmado navegando o protótipo aprovado de verdade, não só o texto do
  // requisito). O card "Sessão" (nome/papel) fica de fora aqui de propósito — o protótipo
  // também não mostra isso na barra mobile, só logo/tema/sair; não é uma omissão, é fidelidade.
  if (mobile) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-card px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-[14.5px] font-semibold tracking-[-0.01em]">Dispatch</span>
          </div>
          <div className="flex flex-none items-center gap-1">
            <button
              onClick={toggleTema}
              aria-label="Alternar tema"
              className="flex size-9 flex-none items-center justify-center rounded-md text-text-2 hover:bg-secondary hover:text-foreground"
            >
              <span
                className="block size-3.5 flex-none rounded-full border-[1.5px] border-current"
                style={{ background: 'linear-gradient(90deg, currentColor 50%, transparent 50%)' }}
              />
            </button>
            <LogoutButton className="w-auto rounded-md px-2.5 py-2 text-center" />
          </div>
        </header>

        <nav className="sticky top-[53px] z-10 flex flex-none gap-1.5 overflow-x-auto border-b border-border bg-card px-3 py-2 whitespace-nowrap">
          {itensNav.map((item) => {
            const badge = badgeDoItem(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-none items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground font-semibold text-background'
                      : 'border-border font-normal text-text-3',
                  )
                }
              >
                <span>{item.label}</span>
                {badge && <NavBadge texto={badge.texto} tom={badge.tom} />}
              </NavLink>
            )
          })}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-stretch">
      <aside className="flex w-56 flex-none flex-col border-r border-border bg-card py-4">
        <div className="flex items-center gap-2 px-4 pb-4">
          <Logo size="sm" />
          <span className="text-[14.5px] font-semibold tracking-[-0.01em]">Dispatch</span>
        </div>

        <div className="px-4 pb-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">Operação</div>
        <nav className="flex flex-col gap-px px-2">
          {itensNav.map((item) => {
            const badge = badgeDoItem(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13.5px] transition-colors hover:bg-secondary hover:text-foreground',
                    isActive ? 'bg-secondary font-semibold text-foreground' : 'font-normal text-text-3',
                  )
                }
              >
                <span className="flex-1">{item.label}</span>
                {badge && <NavBadge texto={badge.texto} tom={badge.tom} />}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border px-4 pt-3">
          <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">Sessão</div>

          {usuario && (
            // RNF-10: nome do usuário logado não trunca
            <div className="flex items-start justify-between gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px]">
              <span className="text-pretty">{usuario.nome}</span>
              <span className="mt-px flex-none text-[11px] text-muted-foreground">{usuario.papel}</span>
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
