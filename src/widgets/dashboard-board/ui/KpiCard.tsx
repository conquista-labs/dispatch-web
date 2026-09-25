import { cn } from '@/shared/lib/utils'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { textoDaMeta, type Variacao } from '../lib/variacao'

type KpiCardProps = {
  label: string
  valor: string
  sub: string
  // Contra o mesmo trecho do período anterior (RF-42b); sem base, não aparece.
  variacao?: Variacao | null
  // Barra de meta (RF-42b) — só a gestão vê (decisão do dono); valor e meta em fração 0–1.
  meta?: { valor: number; meta: number } | null
}

const COR_DA_VARIACAO: Record<Variacao['tom'], string> = {
  bom: 'text-ok-fg',
  ruim: 'text-bad-fg',
  neutro: 'text-text-2',
}

// Card de KPI do protótipo aprovado (Dispatch v2): padding 14/16, valor em 24px com a variação ao
// lado em mono, "sub" no cinza de apoio e, na gestão, a barra de meta com o marcador na posição da meta.
export const KpiCard = ({ label, valor, sub, variacao, meta }: KpiCardProps) => (
  <SurfaceCard className="px-4 py-3.5">
    <div className="text-[11.5px] font-medium text-text-2">{label}</div>
    <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
      <span className="text-[24px] leading-tight font-semibold tracking-[-0.02em]">{valor}</span>
      {variacao && (
        <span className={cn('font-mono text-[11.5px] font-medium', COR_DA_VARIACAO[variacao.tom])}>
          {variacao.texto}
        </span>
      )}
    </div>
    <div className="mt-1 text-[11px] leading-[1.35] text-pretty text-apoio">{sub}</div>
    {meta && (
      <>
        <div className="relative mt-2.5 h-1 rounded-full bg-secondary">
          <div
            className={cn('h-1 rounded-full', meta.valor >= meta.meta ? 'bg-ok-fg' : 'bg-warn-fg')}
            style={{ width: `${Math.min(100, meta.valor * 100)}%` }}
          />
          <div
            className="absolute -top-0.75 h-2.5 w-0.5 rounded-[1px] bg-text-2"
            style={{ left: `${meta.meta * 100}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-1.25 text-[10.5px] text-apoio">{textoDaMeta(meta.valor, meta.meta)}</div>
      </>
    )}
  </SurfaceCard>
)
