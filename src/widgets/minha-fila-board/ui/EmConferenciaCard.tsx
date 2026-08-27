import { prazoChip, type ProtocoloResumo } from '@/entities/protocolo'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { formatCronometro } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SurfaceCard } from '@/shared/ui/surface-card'

const ETAPA_LABEL: Record<ProtocoloResumo['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

type EmConferenciaCardProps = {
  protocolo: ProtocoloResumo
  now: number
  onAprovar: () => void
  onReprovar: () => void
  desabilitado?: boolean
}

// Card "Em conferência" (RF-21/RF-22) — único com borda destacada (é o que está em andamento
// agora) e cronômetro ao vivo em vez do chip de prazo no topo.
export const EmConferenciaCard = ({ protocolo, now, onAprovar, onReprovar, desabilitado }: EmConferenciaCardProps) => {
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
  const decorridoMs = protocolo.iniciadoEm ? now - new Date(protocolo.iniciadoEm).getTime() : 0

  return (
    <SurfaceCard destaque>
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        <span className="font-mono text-sm font-medium">{formatCronometro(decorridoMs)}</span>
      </div>
      <div className="mt-1.5 text-[13px] text-text-5">{ETAPA_LABEL[protocolo.etapa]}</div>
      <div className="mt-1">
        <Chip tom={chip.tom}>{chip.label}</Chip>
      </div>

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} />

      <div className="mt-2 flex gap-1.5">
        <Button onClick={onAprovar} disabled={desabilitado} className="flex-1">
          Aprovar
        </Button>
        <Button variant="destructive" onClick={onReprovar} disabled={desabilitado} className="flex-1">
          Não aprovar
        </Button>
      </div>
    </SurfaceCard>
  )
}
