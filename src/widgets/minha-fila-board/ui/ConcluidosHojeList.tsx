import type { ProtocoloConcluidoResumo } from '@/entities/protocolo'
import { formatDuracaoConcluida } from '@/shared/lib/format'
import { SurfaceCard } from '@/shared/ui/surface-card'

const STATUS_LABEL: Record<string, string> = {
  Aprovado: 'Aprovado',
  Reprovado: 'Não aprovado',
}

const STATUS_CLASSE: Record<string, string> = {
  Aprovado: 'text-ok-fg',
  Reprovado: 'text-bad-fg',
}

type ConcluidosHojeListProps = {
  concluidos: ProtocoloConcluidoResumo[]
}

// RF-24: lista de concluídos do dia, com resultado e duração.
export const ConcluidosHojeList = ({ concluidos }: ConcluidosHojeListProps) => {
  if (concluidos.length === 0) return null

  return (
    <SurfaceCard className="mt-1.5">
      <div className="mb-1.5 text-xs font-semibold text-text-2">Concluídos hoje · {concluidos.length}</div>
      {concluidos.map((protocolo) => (
        <div key={protocolo.id} className="flex items-center justify-between gap-2 border-t border-secondary py-1 text-[12.5px] first:border-t-0">
          <span className="font-mono text-xs text-text-2">{protocolo.numero}</span>
          <span className={`font-medium ${STATUS_CLASSE[protocolo.status] ?? 'text-text-2'}`}>{STATUS_LABEL[protocolo.status] ?? protocolo.status}</span>
          <span className="font-mono text-[11.5px] text-muted-foreground">{protocolo.duracao ? formatDuracaoConcluida(protocolo.duracao) : '—'}</span>
        </div>
      ))}
    </SurfaceCard>
  )
}
