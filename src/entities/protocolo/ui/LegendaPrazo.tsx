import { cn } from '@/shared/lib/utils'

import { type FaixasSemaforo, rotulosDaLegenda } from '../lib/legenda-prazo'

const CORES = [
  'bg-ok-bg border-ok-bar',
  'bg-warn-bg-2 border-warn-bar',
  'bg-crit-bg-2 border-crit-bar',
  'bg-bad-bg-2 border-bad-bar',
] as const

// Legenda "Prazo do ato" das telas de fila (Distribuição, Minha fila, Fila do conferente) — antes
// eram três cópias, uma delas com "4h/60min" fixo que mentia quando a configuração mudava.
export const LegendaPrazo = ({ faixas, className }: { faixas?: FaixasSemaforo | null; className?: string }) => (
  <div className={cn('flex flex-wrap items-center gap-3.5', className)}>
    <span className="text-[11.5px] font-medium text-apoio">Prazo do ato</span>
    {rotulosDaLegenda(faixas).map((rotulo, indice) => (
      <span key={indice} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
        <span className={cn('block size-2.5 flex-none rounded-[3px] border', CORES[indice])} />
        {rotulo}
      </span>
    ))}
  </div>
)
