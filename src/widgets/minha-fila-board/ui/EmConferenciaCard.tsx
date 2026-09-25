import { PauseIcon, PlayIcon } from 'lucide-react'

import {
  NumeroConferenciaTag,
  prazoChip,
  PrazoTooltip,
  PrioridadeAltaTag,
  type ProtocoloResumo,
} from '@/entities/protocolo'
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
  onAprovar?: () => void
  onReprovar?: () => void
  /** Pedido do dono ("a pessoa sai pra almoçar") — congela o cronômetro sem devolver o ato pra
   * fila (continua ocupando o limite de simultâneos, RF-21). */
  onPausar?: () => void
  onRetomar?: () => void
  desabilitado?: boolean
  /** Distribuidora vendo a fila de um conferente (RF-19) — sem ação, sem editar observação. */
  somenteLeitura?: boolean
}

// Card "Em conferência" (RF-21/RF-22) — único com borda destacada (é o que está em andamento
// agora) e cronômetro ao vivo em vez do chip de prazo no topo.
export const EmConferenciaCard = ({
  protocolo,
  now,
  onAprovar,
  onReprovar,
  onPausar,
  onRetomar,
  desabilitado,
  somenteLeitura,
}: EmConferenciaCardProps) => {
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
  const pausado = !!protocolo.pausadoEm
  const decorridoMs = protocolo.iniciadoEm ? now - new Date(protocolo.iniciadoEm).getTime() : 0

  return (
    <SurfaceCard destaque>
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        <div className="flex items-center gap-1">
          {pausado ? (
            <span className="font-mono text-sm font-medium text-muted-foreground">Pausado</span>
          ) : (
            <span className="font-mono text-sm font-medium">{formatCronometro(decorridoMs)}</span>
          )}
          {!somenteLeitura && !pausado && onPausar && (
            <button
              type="button"
              onClick={onPausar}
              disabled={desabilitado}
              title="Pausar"
              aria-label="Pausar"
              className="flex-none rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <PauseIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {protocolo.prioridade === 'Alta' && <PrioridadeAltaTag />}
        <NumeroConferenciaTag numero={protocolo.numeroDaConferencia} />
        <span className="text-[13px] text-text-5">{ETAPA_LABEL[protocolo.etapa]}</span>
      </div>
      <div className="mt-1">
        <PrazoTooltip>
          <Chip tom={chip.tom}>{chip.label}</Chip>
        </PrazoTooltip>
      </div>

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} somenteLeitura={somenteLeitura} />

      {!somenteLeitura && pausado && onRetomar && (
        <Button
          onClick={onRetomar}
          disabled={desabilitado}
          className="mt-2 w-full gap-1.5 max-mobile:h-11 max-mobile:text-[14px]"
        >
          <PlayIcon className="size-4" />
          Retomar
        </Button>
      )}

      {!somenteLeitura && !pausado && onAprovar && onReprovar && (
        <div className="mt-2 flex gap-1.5">
          <Button onClick={onAprovar} disabled={desabilitado} className="flex-1 max-mobile:h-11 max-mobile:text-[14px]">
            Aprovar
          </Button>
          <Button
            variant="destructive"
            onClick={onReprovar}
            disabled={desabilitado}
            className="flex-1 max-mobile:h-11 max-mobile:text-[14px]"
          >
            Não aprovar
          </Button>
        </div>
      )}
    </SurfaceCard>
  )
}
