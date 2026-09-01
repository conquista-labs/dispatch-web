import { prazoChip, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SurfaceCard } from '@/shared/ui/surface-card'

const ETAPA_LABEL: Record<ProtocoloResumo['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

type ProtocoloCardProps = {
  protocolo: ProtocoloResumo
  now: number
  /** RF-19/RF-24: tipo de ato/escrevente/equipe do card — protótipo v2 passou a mostrar isso
   * aqui também, não só em Distribuição. */
  info: InfoProtocolo
  acaoLabel?: string
  onAcao?: () => void
  acaoDesabilitada?: boolean
  /** "outline": Pegar este (pool). "default": Iniciar conferência (atribuídas). */
  acaoVariante?: 'outline' | 'default'
  /** Distribuidora vendo a fila de um conferente (RF-19) — sem ação, sem editar observação. */
  somenteLeitura?: boolean
}

// Card do pool disponível / atribuídos a você (RF-19) — mesmo layout dos dois, só muda o
// botão de ação ("Pegar este" / "Iniciar conferência").
export const ProtocoloCard = ({ protocolo, now, info, acaoLabel, onAcao, acaoDesabilitada, acaoVariante = 'outline', somenteLeitura }: ProtocoloCardProps) => {
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)

  return (
    <SurfaceCard tom={chip.tom}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        <Chip tom={chip.tom}>{chip.label}</Chip>
      </div>
      <div className="mt-1.5 text-[13px] text-pretty text-text-5">{info.tipoAtoNome ?? '—'}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Chip tom={info.equipeNome ? 'neutro' : 'vencido'}>{info.equipeNome ?? 'sem equipe'}</Chip>
        <Chip tom="neutro">{ETAPA_LABEL[protocolo.etapa]}</Chip>
      </div>
      <div className="mt-1 text-[12px] text-pretty text-muted-foreground">{info.escreventeNome ?? '—'}</div>

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} somenteLeitura={somenteLeitura} />

      {!somenteLeitura && onAcao && (
        <Button variant={acaoVariante} onClick={onAcao} disabled={acaoDesabilitada} className="mt-1.5 w-full">
          {acaoLabel}
        </Button>
      )}
    </SurfaceCard>
  )
}
