import {
  LayoutDashboardIcon,
  ListChecksIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ShieldCheckIcon,
  UploadIcon,
  UsersIcon,
  WorkflowIcon,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useVisaoDistribuicao } from '@/entities/protocolo'
import { useSugestoesPendentes } from '@/entities/sugestao'
import { type Papel, useSessionStore } from '@/entities/usuario'
import { LogoutButton } from '@/features/auth/logout'
import { ROUTES } from '@/shared/config/routes'
import { useSidebarStore } from '@/shared/lib/sidebar-store'
import { useThemeStore } from '@/shared/lib/theme-store'
import { useIsMobile } from '@/shared/lib/use-is-mobile'
import { cn } from '@/shared/lib/utils'
import { Logo } from '@/shared/ui/logo'

// RF-25 a RF-46 vão crescer essa lista por papel — Distribuidora ganha mais itens conforme
// as telas de gestão nascem (Conferentes, Central de regras, Dashboard...). `icon` só é usado
// no rail recolhido (RNF nenhum — pedido direto do dono, não vem do protótipo): sem ele não
// dava pra identificar item nenhum só com a largura de um ícone.
const NAV_POR_PAPEL: Record<Papel, { label: string; to: string; icon: LucideIcon }[]> = {
  Distribuidora: [
    { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboardIcon },
    { label: 'Distribuição', to: ROUTES.distribuicao, icon: WorkflowIcon },
    { label: 'Importar', to: ROUTES.importar, icon: UploadIcon },
    // RF-19: protótipo aprovado tem "Minha fila" no menu de quem é gestão também — mesmo
    // rótulo, ordem do protótipo (entre Importar e Conferentes); o conteúdo é diferente
    // (ROUTES.filaConferentes: escolhe um conferente, vê a fila dele em leitura).
    { label: 'Minha fila', to: ROUTES.filaConferentes, icon: ListChecksIcon },
    { label: 'Conferentes', to: ROUTES.conferentes, icon: UsersIcon },
    { label: 'Central de regras', to: ROUTES.centralDeRegras, icon: ShieldCheckIcon },
  ],
  Conferente: [
    { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboardIcon },
    { label: 'Minha fila', to: ROUTES.minhaFila, icon: ListChecksIcon },
  ],
}

// Pedido do dono: uma distribuidora que também confere (mesma conta, os dois papéis) — nesse
// caso a base é a lista completa de gestão, e a "Minha fila" dela (que na verdade é "ver a
// fila de outro conferente", `ROUTES.filaConferentes`) precisa desambiguar da fila de verdade
// da própria pessoa (`ROUTES.minhaFila`, que o papel Conferente já tem) — por isso a versão da
// Distribuidora é renomeada pra "Fila de conferentes" só quando os dois papéis coexistem;
// alguém só-Distribuidora continua vendo "Minha fila" exatamente como sempre foi.
const itensNavPara = (papeis: Papel[]) => {
  const ehDistribuidora = papeis.includes('Distribuidora')
  const ehConferente = papeis.includes('Conferente')
  const base = ehDistribuidora ? NAV_POR_PAPEL.Distribuidora : NAV_POR_PAPEL.Conferente

  if (!ehDistribuidora || !ehConferente) return base

  const minhaFilaDeVerdade = NAV_POR_PAPEL.Conferente.find((item) => item.to === ROUTES.minhaFila)
  if (!minhaFilaDeVerdade) return base

  return base.flatMap((item) =>
    item.to === ROUTES.filaConferentes ? [{ ...item, label: 'Fila de conferentes' }, minhaFilaDeVerdade] : [item],
  )
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
  const recolhida = useSidebarStore((state) => state.recolhida)
  const toggleRecolhida = useSidebarStore((state) => state.toggleRecolhida)

  const ehDistribuidora = usuario?.papeis.includes('Distribuidora') ?? false
  const { data: visao } = useVisaoDistribuicao({ enabled: ehDistribuidora })
  const { data: sugestoesPendentes } = useSugestoesPendentes({ enabled: ehDistribuidora })

  const itensNav = usuario ? itensNavPara(usuario.papeis) : []

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
      <aside
        className={cn(
          'flex flex-none flex-col border-r border-border bg-card py-4 transition-[width] duration-150',
          recolhida ? 'w-[68px]' : 'w-56',
        )}
      >
        <div className={cn('flex items-center gap-2 px-4 pb-4', recolhida && 'flex-col px-0')}>
          <Logo size="sm" />
          {!recolhida && <span className="flex-1 text-[14.5px] font-semibold tracking-[-0.01em]">Dispatch</span>}
          <button
            onClick={toggleRecolhida}
            aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
            title={recolhida ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'flex size-7 flex-none items-center justify-center rounded-md text-text-2 hover:bg-secondary hover:text-foreground',
              !recolhida && 'ml-auto',
            )}
          >
            {recolhida ? <PanelLeftOpenIcon className="size-4" /> : <PanelLeftCloseIcon className="size-4" />}
          </button>
        </div>

        {!recolhida && (
          <div className="px-4 pb-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">Operação</div>
        )}
        <nav className={cn('flex flex-col gap-px px-2', recolhida && 'items-center px-2')}>
          {itensNav.map((item) => {
            const badge = badgeDoItem(item.to)
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={recolhida ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13.5px] transition-colors hover:bg-secondary hover:text-foreground',
                    // Recolhido: item vira um botão quadrado (mesma medida do toggle no
                    // cabeçalho), não só padding zerado — sem isso o fundo ativo ficava uma
                    // faixa estreita e alta (só a largura do ícone), espremida, em vez de um
                    // quadrado com respiro igual nos 4 lados.
                    recolhida && 'size-9 flex-none justify-center gap-0 p-0',
                    isActive ? 'bg-secondary font-semibold text-foreground' : 'font-normal text-text-3',
                  )
                }
              >
                <Icon className="size-4 flex-none" />
                {!recolhida && <span className="flex-1">{item.label}</span>}
                {!recolhida && badge && <NavBadge texto={badge.texto} tom={badge.tom} />}
                {recolhida && badge && (
                  <span
                    className={cn(
                      'absolute top-1 right-1 size-1.5 flex-none rounded-full',
                      badge.tom === 'atencao' ? 'bg-warn-fg' : 'bg-text-3',
                    )}
                  />
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className={cn('mt-auto border-t border-border px-4 pt-3', recolhida && 'px-2')}>
          {!recolhida && <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">Sessão</div>}

          {usuario &&
            (recolhida ? (
              <div
                title={`${usuario.nome} · ${usuario.papeis.join(' · ')}`}
                className="mx-auto flex size-8 items-center justify-center rounded-full border border-border bg-card text-[12px] font-semibold text-text-2"
              >
                {usuario.nome.charAt(0).toUpperCase()}
              </div>
            ) : (
              // RNF-10: nome do usuário logado não trunca
              <div className="flex items-start justify-between gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px]">
                <span className="text-pretty">{usuario.nome}</span>
                <span className="mt-px flex-none text-[11px] text-muted-foreground">{usuario.papeis.join(' · ')}</span>
              </div>
            ))}

          <button
            onClick={toggleTema}
            title={recolhida ? (tema === 'dark' ? 'Trocar para tema claro' : 'Trocar para tema escuro') : undefined}
            className={cn(
              'mt-1.5 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-text-2 hover:bg-secondary hover:text-foreground',
              recolhida && 'justify-center px-0',
            )}
          >
            <span
              className="block size-3 flex-none rounded-full border-[1.5px] border-current"
              style={{ background: 'linear-gradient(90deg, currentColor 50%, transparent 50%)' }}
            />
            {!recolhida && (
              <>
                <span className="flex-1">{tema === 'dark' ? 'Escuro' : 'Claro'}</span>
                <span className="text-[11px] text-muted-foreground">trocar</span>
              </>
            )}
          </button>

          <div className="mt-0.5">
            <LogoutButton iconOnly={recolhida} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
