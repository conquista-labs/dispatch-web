import type { ProtocoloResumo } from '@/entities/protocolo'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { prazoChip } from '../lib/prazo-chip'
import { ObservacaoField } from './ObservacaoField'

const ETAPA_LABEL: Record<ProtocoloResumo['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

type ProtocoloCardProps = {
  protocolo: ProtocoloResumo
  now: number
  acaoLabel: string
  onAcao: () => void
  acaoDesabilitada?: boolean
  /** "outline": Pegar este (pool). "default": Iniciar conferência (atribuídas). */
  acaoVariante?: 'outline' | 'default'
}

// Card do pool disponível / atribuídos a você (RF-19) — mesmo layout dos dois, só muda o
// botão de ação ("Pegar este" / "Iniciar conferência").
export const ProtocoloCard = ({ protocolo, now, acaoLabel, onAcao, acaoDesabilitada, acaoVariante = 'outline' }: ProtocoloCardProps) => {
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        <Chip tom={chip.tom}>{chip.label}</Chip>
      </div>
      <div className="mt-1.5 text-[13px] text-text-5">{ETAPA_LABEL[protocolo.etapa]}</div>

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} />

      <Button variant={acaoVariante} onClick={onAcao} disabled={acaoDesabilitada} className="mt-1.5 w-full">
        {acaoLabel}
      </Button>
    </SurfaceCard>
  )
}
