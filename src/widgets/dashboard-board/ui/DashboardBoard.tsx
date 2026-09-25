import { useState } from 'react'

import { PERIODO_LABEL, useDashboard, type PeriodoDashboard } from '@/entities/dashboard'
import { cn } from '@/shared/lib/utils'
import { Carregando } from '@/shared/ui/carregando'

import { FaixaDeHoje } from './FaixaDeHoje'
import { VisaoConferente } from './VisaoConferente'
import { VisaoGestao } from './VisaoGestao'

// Ordem do protótipo aprovado (Dispatch v2, PERIODOS): o mês é o padrão e vem primeiro.
const PERIODOS: PeriodoDashboard[] = ['Mes', 'Semana', 'Trimestre']

type DashboardBoardProps = {
  titulo: string
  subtitulo: string
  souGestao: boolean
}

// RF-42. O cabeçalho mora aqui (e não na página) porque o seletor de período fica na mesma linha do
// título, como no protótipo, e o período é estado deste widget.
export const DashboardBoard = ({ titulo, subtitulo, souGestao }: DashboardBoardProps) => {
  const [periodo, setPeriodo] = useState<PeriodoDashboard>('Mes')
  const { data: dashboard, isLoading } = useDashboard(periodo)
  const periodoLabel = PERIODO_LABEL[periodo].toLowerCase()

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-[1_1_280px]">
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">{titulo}</h1>
          <p className="mt-1.5 text-[13.5px] text-pretty text-text-2">{subtitulo}</p>
        </div>
        <div className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-secondary p-0.75">
          {PERIODOS.map((valor) => (
            <button
              key={valor}
              onClick={() => setPeriodo(valor)}
              aria-pressed={periodo === valor}
              className={cn(
                'flex-none rounded-[6px] px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-text-2',
                periodo === valor && 'bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
              )}
            >
              {PERIODO_LABEL[valor]}
            </button>
          ))}
        </div>
      </header>

      <FaixaDeHoje />

      <div className="mt-6.5">
        {isLoading || !dashboard ? (
          <Carregando />
        ) : souGestao ? (
          <VisaoGestao dashboard={dashboard} periodo={periodo} periodoLabel={periodoLabel} />
        ) : (
          <VisaoConferente dashboard={dashboard} periodoLabel={periodoLabel} />
        )}
      </div>
    </div>
  )
}
