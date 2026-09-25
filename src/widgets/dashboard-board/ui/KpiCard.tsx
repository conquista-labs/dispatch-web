import { SurfaceCard } from '@/shared/ui/surface-card'

type KpiCardProps = {
  label: string
  valor: string
  sub: string
}

// Card de KPI do protótipo aprovado (Dispatch v2): padding 14/16, valor em 24px, "sub" no cinza de
// apoio. Variação contra o período anterior e barra de meta entram com o Dashboard v2 (RF-42b), que
// ainda não tem o dado no back.
export const KpiCard = ({ label, valor, sub }: KpiCardProps) => (
  <SurfaceCard className="px-4 py-3.5">
    <div className="text-[11.5px] font-medium text-text-2">{label}</div>
    <div className="mt-1.5 text-[24px] leading-tight font-semibold tracking-[-0.02em]">{valor}</div>
    <div className="mt-1 text-[11px] leading-[1.35] text-apoio">{sub}</div>
  </SurfaceCard>
)
