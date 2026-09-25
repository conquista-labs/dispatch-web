import { cn } from '@/shared/lib/utils'
import { SurfaceCard } from '@/shared/ui/surface-card'

import type { Variacao } from '../lib/variacao'

type KpiCardProps = {
  label: string
  valor: string
  sub: string
  // Contra o mesmo trecho do período anterior (RF-42b); sem base, não aparece.
  variacao?: Variacao | null
}

const COR_DA_VARIACAO: Record<Variacao['tom'], string> = {
  bom: 'text-ok-fg',
  ruim: 'text-bad-fg',
  neutro: 'text-text-2',
}

// Card de KPI do protótipo aprovado (Dispatch v2): padding 14/16, valor em 24px com a variação ao
// lado em mono, "sub" no cinza de apoio. A barra de meta entra com a fatia 2 (metas configuráveis).
export const KpiCard = ({ label, valor, sub, variacao }: KpiCardProps) => (
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
  </SurfaceCard>
)
