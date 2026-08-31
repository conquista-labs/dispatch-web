import { useState } from 'react'

import { PERIODO_LABEL, useDashboard, type PeriodoDashboard } from '@/entities/dashboard'
import { cn } from '@/shared/lib/utils'

import { VisaoConferente } from './VisaoConferente'
import { VisaoGestao } from './VisaoGestao'

const PERIODOS: PeriodoDashboard[] = ['Semana', 'Mes', 'Trimestre']

type DashboardBoardProps = {
  souGestao: boolean
}

// RF-42: seletor de período (tabs simples, só 3 opções fixas — mesmo padrão de
// DistribuicaoBoard/CentralDeRegrasBoard, não precisa de dropdown pra isso).
export const DashboardBoard = ({ souGestao }: DashboardBoardProps) => {
  const [periodo, setPeriodo] = useState<PeriodoDashboard>('Mes')
  const { data: dashboard, isLoading } = useDashboard(periodo)

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {PERIODOS.map((valor) => (
          <button
            key={valor}
            onClick={() => setPeriodo(valor)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground',
              periodo === valor && 'bg-card text-foreground shadow-sm',
            )}
          >
            {PERIODO_LABEL[valor]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isLoading || !dashboard ? (
          <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
        ) : souGestao ? (
          <VisaoGestao dashboard={dashboard} periodoLabel={PERIODO_LABEL[periodo]} />
        ) : (
          <VisaoConferente dashboard={dashboard} />
        )}
      </div>
    </div>
  )
}
