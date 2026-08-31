import type { Conferente } from '@/entities/conferente'
import { usePedidosReaberturaPendentes } from '@/entities/pedidoReabertura'
import type { ProtocoloResumo } from '@/entities/protocolo'

import { ExcecaoCard } from './ExcecaoCard'
import { PedidoReaberturaCard } from './PedidoReaberturaCard'

type AbaExcecoesProps = {
  excecoes: ProtocoloResumo[]
  conferentes: Conferente[]
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-17 + RF-24c (pedidos de reabertura contabilizados à parte das exceções — RF-18b).
export const AbaExcecoes = ({ excecoes, conferentes, onAbrirDetalhe }: AbaExcecoesProps) => {
  const { data: pedidos } = usePedidosReaberturaPendentes()

  if (excecoes.length === 0 && (!pedidos || pedidos.length === 0)) {
    return (
      <div className="max-w-[780px] rounded-xl border border-dashed border-border bg-card p-10 text-center text-[13.5px] text-muted-foreground">
        Nenhuma exceção pendente. Tudo o que entrou foi distribuído.
      </div>
    )
  }

  return (
    <div className="max-w-[780px]">
      {pedidos && pedidos.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 text-[13.5px] font-semibold">Pedidos de reabertura · {pedidos.length}</div>
          <p className="mb-2.5 text-[12.5px] text-muted-foreground text-pretty">
            O conferente concluiu e percebeu que precisa mexer de novo. Só a distribuidora pode devolver um ato para conferência.
          </p>
          {pedidos.map((pedido) => (
            <PedidoReaberturaCard key={pedido.pedidoId} pedido={pedido} onAbrirDetalhe={onAbrirDetalhe} />
          ))}
        </div>
      )}

      {excecoes.map((protocolo) => (
        <ExcecaoCard key={protocolo.id} protocolo={protocolo} conferentes={conferentes} onAbrirDetalhe={onAbrirDetalhe} />
      ))}
    </div>
  )
}
