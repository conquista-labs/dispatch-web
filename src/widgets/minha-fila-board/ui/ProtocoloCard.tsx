import {
  NumeroConferenciaTag,
  prazoChip,
  PrazoTooltip,
  PrioridadeAltaTag,
  type InfoProtocolo,
  type ProtocoloResumo,
} from '@/entities/protocolo'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { formatDataHora } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
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
  /** RF-23: só o dono edita observação — um protocolo do pool ainda não tem dono, então só
   * essa parte do card fica travada (a ação, ex.: "Pegar este", continua ativa). Diferente de
   * `somenteLeitura`, que desliga o card inteiro. */
  observacaoSomenteLeitura?: boolean
  /** RF-24j — o "Ver" da faixa de prioridade alta destaca o card por alguns segundos. */
  destacado?: boolean
}

// Card do pool disponível / atribuídos a você (RF-19) — mesmo layout dos dois, só muda o
// botão de ação ("Pegar este" / "Iniciar conferência").
export const ProtocoloCard = ({
  protocolo,
  now,
  info,
  acaoLabel,
  onAcao,
  acaoDesabilitada,
  acaoVariante = 'outline',
  somenteLeitura,
  observacaoSomenteLeitura,
  destacado,
}: ProtocoloCardProps) => {
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)

  return (
    <SurfaceCard
      tom={chip.tom}
      data-protocolo-id={protocolo.id}
      className={cn(destacado && 'ring-2 ring-foreground motion-safe:animate-anel-destaque')}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        <PrazoTooltip>
          <Chip tom={chip.tom}>{chip.label}</Chip>
        </PrazoTooltip>
      </div>
      <div className="mt-1.5 text-[13px] text-pretty text-text-5">{info.tipoAtoNome ?? '—'}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {protocolo.prioridade === 'Alta' && <PrioridadeAltaTag />}
        <NumeroConferenciaTag numero={protocolo.numeroDaConferencia} />
        <Chip tom={info.equipeNome ? 'neutro' : 'vencido'} fonte="padrao" className="font-medium">
          {info.equipeNome ?? 'sem equipe'}
        </Chip>
        <Chip tom="neutro" fonte="padrao">
          {ETAPA_LABEL[protocolo.etapa]}
        </Chip>
      </div>
      <div className="mt-1 text-[11.5px] text-pretty text-muted-foreground">{info.escreventeNome ?? '—'}</div>
      <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
        entrada {formatDataHora(protocolo.andamentoEm)}
      </div>

      <ObservacaoField
        protocoloId={protocolo.id}
        observacao={protocolo.observacao}
        somenteLeitura={somenteLeitura || observacaoSomenteLeitura}
      />

      {!somenteLeitura && onAcao && (
        <Button
          variant={acaoVariante}
          onClick={onAcao}
          disabled={acaoDesabilitada}
          className="mt-1.5 w-full max-mobile:h-11 max-mobile:text-[14px]"
        >
          {acaoLabel}
        </Button>
      )}
    </SurfaceCard>
  )
}
