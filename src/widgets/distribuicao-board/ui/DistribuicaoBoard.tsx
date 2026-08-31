import { useState } from 'react'

import { useConferentes } from '@/entities/conferente'
import { usePedidosReaberturaPendentes } from '@/entities/pedidoReabertura'
import { useVisaoDistribuicao } from '@/entities/protocolo'
import { cn } from '@/shared/lib/utils'
import { useNow } from '@/shared/lib/use-now'
import { PainelDetalheProtocolo } from '@/widgets/painel-detalhe-protocolo'

import { AbaExcecoes } from './AbaExcecoes'
import { AbaPorConferente } from './AbaPorConferente'
import { AbaPorStatus } from './AbaPorStatus'

type Aba = 'conferente' | 'status' | 'excecoes'

// Texto e cor batendo com o protótipo aprovado (Dispatch.dc.html, `faixas()`/legenda): mesmos
// limiares hardcoded do back (4h/60min, ver DistribuicaoEndpoints.cs) até existir tabela de
// config — se um dia virar configurável, esse texto precisa vir junto.
const LEGENDA = [
  { label: 'no prazo', className: 'bg-ok-bg border-ok-bar' },
  { label: 'faltam menos de 4h', className: 'bg-warn-bg-2 border-warn-bar' },
  { label: 'faltam menos de 60min', className: 'bg-crit-bg-2 border-crit-bar' },
  { label: 'prazo estourado', className: 'bg-bad-bg-2 border-bad-bar' },
]

// As 3 visões do mesmo conjunto de protocolos (RF-13) — "por conferente" (empurra), "por
// status" (kanban) e "exceções" (RF-17).
export const DistribuicaoBoard = () => {
  const [aba, setAba] = useState<Aba>('conferente')
  const [protocoloDetalheId, setProtocoloDetalheId] = useState<string | null>(null)
  const { data: visao, isLoading } = useVisaoDistribuicao()
  const { data: conferentes } = useConferentes()
  const { data: pedidosReabertura } = usePedidosReaberturaPendentes()
  const now = useNow()

  if (isLoading || !visao || !conferentes) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const conferentesNaEscala = conferentes.filter((c) => c.naEscala)
  // RF-18b: exceções e pedidos de reabertura contam separado, no mesmo rótulo da aba.
  const qtdPedidos = pedidosReabertura?.length ?? 0
  const sufixoPedidos = qtdPedidos > 0 ? ` · ${qtdPedidos} ${qtdPedidos > 1 ? 'pedidos' : 'pedido'}` : ''

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['conferente', 'Por conferente'],
            ['status', 'Por status'],
            ['excecoes', `Exceções · ${visao.excecoes.length}${sufixoPedidos}`],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground',
              aba === valor && 'bg-card text-foreground shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
        <span className="font-mono text-[11.5px] text-muted-foreground">Prazo do ato</span>
        {LEGENDA.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
            <span className={`block size-2.5 flex-none rounded-[3px] border ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="mt-4">
        {aba === 'conferente' && (
          <AbaPorConferente
            pool={visao.pool}
            porConferente={visao.porConferente}
            conferentes={conferentesNaEscala}
            now={now}
            onAbrirDetalhe={setProtocoloDetalheId}
          />
        )}
        {aba === 'status' && <AbaPorStatus visao={visao} conferentes={conferentes} now={now} onAbrirDetalhe={setProtocoloDetalheId} />}
        {aba === 'excecoes' && <AbaExcecoes excecoes={visao.excecoes} conferentes={conferentesNaEscala} onAbrirDetalhe={setProtocoloDetalheId} />}
      </div>

      <PainelDetalheProtocolo protocoloId={protocoloDetalheId} onFechar={() => setProtocoloDetalheId(null)} />
    </div>
  )
}
