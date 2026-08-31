import { SurfaceCard } from '@/shared/ui/surface-card'

type KpiCardProps = {
  label: string
  valor: string
  sub: string
}

// Mesmo padrão de card de KPI já usado em AbaAprendizado.tsx (Central de Regras) — 3ª
// repetição (a 2ª foi ConferentesBoard, sem o "sub"), mas esse widget tem estrutura própria
// o bastante (mais campos, papéis diferentes) pra não valer a pena virar componente genérico
// em shared/ui ainda — só o miolo visual (label/valor/sub) é repetido.
export const KpiCard = ({ label, valor, sub }: KpiCardProps) => (
  <SurfaceCard className="p-3.5">
    <div className="text-[11.5px] font-medium text-text-2">{label}</div>
    <div className="mt-1.25 text-[22px] font-semibold tracking-[-0.02em]">{valor}</div>
    <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
  </SurfaceCard>
)
