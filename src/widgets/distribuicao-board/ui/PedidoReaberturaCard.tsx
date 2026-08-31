import type { PedidoReabertura } from '@/entities/pedidoReabertura'
import { useDecidirPedidoReabertura } from '@/features/protocolo/decidir-pedido-reabertura'
import { formatDataHora } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

const ETAPA_LABEL: Record<PedidoReabertura['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

type PedidoReaberturaCardProps = {
  pedido: PedidoReabertura
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-24c — decisão binária (reabrir ou negar), sem alternar pra formulário como ExcecaoCard
// (não precisa escolher conferente: reabrir mantém o mesmo dono).
export const PedidoReaberturaCard = ({ pedido, onAbrirDetalhe }: PedidoReaberturaCardProps) => {
  const decidir = useDecidirPedidoReabertura()

  return (
    <SurfaceCard
      data-testid={`pedido-reabertura-${pedido.pedidoId}`}
      className="mb-2 cursor-pointer"
      onClick={() => onAbrirDetalhe(pedido.protocoloId)}
    >
      <div className="flex items-start justify-between gap-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-medium">{pedido.protocoloNumero}</span>
            <span className="text-[13px] text-text-5">{ETAPA_LABEL[pedido.etapa]}</span>
          </div>
          <div className="mt-1 text-[12.5px] leading-snug text-text-2">
            {pedido.nomeSolicitante} · pedido em {formatDataHora(pedido.criadoEm)}
          </div>
        </div>

        <div className="flex flex-none gap-1.5" onClick={(evento) => evento.stopPropagation()}>
          <Button
            variant="outline"
            onClick={() => decidir.mutate({ pedidoId: pedido.pedidoId, aprovar: false })}
            disabled={decidir.isPending}
          >
            Negar
          </Button>
          <Button onClick={() => decidir.mutate({ pedidoId: pedido.pedidoId, aprovar: true })} disabled={decidir.isPending}>
            Reabrir
          </Button>
        </div>
      </div>
    </SurfaceCard>
  )
}
