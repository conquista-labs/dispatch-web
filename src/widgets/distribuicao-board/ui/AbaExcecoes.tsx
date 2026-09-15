import type { Conferente } from '@/entities/conferente'
import { usePedidosReaberturaPendentes } from '@/entities/pedidoReabertura'
import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'

import { ExcecaoCard } from './ExcecaoCard'
import { PedidoReaberturaCard } from './PedidoReaberturaCard'

type AbaExcecoesProps = {
  excecoes: ProtocoloResumo[]
  conferentes: Conferente[]
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-17 + RF-24c (pedidos de reabertura contabilizados à parte das exceções — RF-18b).
export const AbaExcecoes = ({ excecoes, conferentes, resolverInfo, onAbrirDetalhe }: AbaExcecoesProps) => {
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
          <p className="mb-2.5 text-[12.5px] text-pretty text-muted-foreground">
            O conferente concluiu e percebeu que precisa mexer de novo. Só a distribuidora pode devolver um ato para
            conferência.
          </p>
          {pedidos.map((pedido) => (
            <PedidoReaberturaCard key={pedido.pedidoId} pedido={pedido} onAbrirDetalhe={onAbrirDetalhe} />
          ))}
        </div>
      )}

      {excecoes.length > 0 && (
        <>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <div className="text-[13.5px] font-semibold">Exceções</div>
            <span className="font-mono text-[11px] text-muted-foreground">{excecoes.length}</span>
          </div>
          {/* Achado real (dono): diferente das outras colunas de Distribuição (que truncam com
              "+N" — ver ProtocoloColuna), aqui cada item exige resolução (atribuir ou
              descartar) — esconder atrás de um "ver mais" atrapalharia o trabalho, então só a
              rolagem própria contém a altura (a busca livre já vem de `BarraDeFiltros`, no
              board pai — `excecoes` aqui já chega filtrada, não precisa de uma segunda busca). */}
          <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto">
            {excecoes.map((protocolo) => (
              <ExcecaoCard
                key={protocolo.id}
                protocolo={protocolo}
                conferentes={conferentes}
                info={resolverInfo(protocolo)}
                onAbrirDetalhe={onAbrirDetalhe}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
