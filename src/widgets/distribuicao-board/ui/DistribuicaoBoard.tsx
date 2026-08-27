import { useState } from 'react'

import { useConferentes } from '@/entities/conferente'
import { useVisaoDistribuicao } from '@/entities/protocolo'
import { cn } from '@/shared/lib/utils'
import { useNow } from '@/shared/lib/use-now'

import { AbaExcecoes } from './AbaExcecoes'
import { AbaPorConferente } from './AbaPorConferente'
import { AbaPorStatus } from './AbaPorStatus'

type Aba = 'conferente' | 'status' | 'excecoes'

const LEGENDA = [
  { label: 'no prazo', className: 'bg-ok-bg border-ok-border-2' },
  { label: 'atenção', className: 'bg-warn-bg-2 border-warn-border-2' },
  { label: 'crítico', className: 'bg-crit-bg-2 border-crit-border' },
  { label: 'vencido', className: 'bg-bad-bg-2 border-bad-border-2' },
]

// As 3 visões do mesmo conjunto de protocolos (RF-13) — "por conferente" (empurra), "por
// status" (kanban) e "exceções" (RF-17).
export const DistribuicaoBoard = () => {
  const [aba, setAba] = useState<Aba>('conferente')
  const { data: visao, isLoading } = useVisaoDistribuicao()
  const { data: conferentes } = useConferentes()
  const now = useNow()

  if (isLoading || !visao || !conferentes) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const conferentesNaEscala = conferentes.filter((c) => c.naEscala)

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['conferente', 'Por conferente'],
            ['status', 'Por status'],
            ['excecoes', `Exceções · ${visao.excecoes.length}`],
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

      {aba !== 'excecoes' && (
        <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
          <span className="font-mono text-[11.5px] text-muted-foreground">Prazo do ato</span>
          {LEGENDA.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
              <span className={`block size-2.5 flex-none rounded-[3px] border ${item.className}`} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        {aba === 'conferente' && <AbaPorConferente pool={visao.pool} porConferente={visao.porConferente} conferentes={conferentesNaEscala} now={now} />}
        {aba === 'status' && <AbaPorStatus visao={visao} conferentes={conferentes} now={now} />}
        {aba === 'excecoes' && <AbaExcecoes excecoes={visao.excecoes} conferentes={conferentesNaEscala} />}
      </div>
    </div>
  )
}
