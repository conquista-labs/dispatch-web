import type { PeriodoDashboard, SerieDashboard } from '@/entities/dashboard'
import { cn } from '@/shared/lib/utils'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { rotulosDaSerie, TITULO_DA_SERIE } from '../lib/variacao'

const ALTURA = 150

// RF-42c — barras empilhadas "no prazo" × "estourados" por dia útil (semana/mês) ou por semana
// (trimestre), como no protótipo. Em CSS puro: 5 a 23 barras não pedem biblioteca de gráfico. Os
// dias que ainda não chegaram aparecem como um traço, pra dar a noção de onde o período está.
export const SerieCard = ({ serie, periodo }: { serie: SerieDashboard; periodo: PeriodoDashboard }) => {
  const maximo = Math.max(1, ...serie.pontos.map((p) => p.conferidos))
  const rotulos = rotulosDaSerie(serie, periodo)
  const { titulo, sub } = TITULO_DA_SERIE[periodo]
  const espaco = serie.pontos.length > 16 ? 'gap-1' : 'gap-2'

  return (
    <SurfaceCard className="mt-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[13.5px] font-semibold">{titulo}</div>
          <div className="mt-0.75 text-[11.5px] text-apoio">{sub}</div>
        </div>
        <div className="flex gap-3.5 text-[11.5px] text-text-2">
          <span className="flex items-center gap-1.5">
            <span className="block size-2 rounded-[2px] bg-foreground/60" />
            no prazo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="block size-2 rounded-[2px] bg-bad-bar" />
            estourados
          </span>
        </div>
      </div>

      <div className={cn('mt-4 flex items-end', espaco)} style={{ height: ALTURA }} role="img" aria-label={titulo}>
        {serie.pontos.map((ponto, i) => {
          const noPrazo = ponto.conferidos - ponto.estourados
          return (
            <div
              key={ponto.inicio}
              title={ponto.futuro ? rotulos[i] : `${ponto.conferidos} conferidos · ${ponto.estourados} estourados`}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              {ponto.futuro ? (
                <div className="h-0.5 rounded-full bg-secondary" />
              ) : (
                <>
                  <div
                    className="rounded-t-[3px] bg-bad-bar"
                    style={{ height: `${(ponto.estourados / maximo) * ALTURA}px` }}
                  />
                  <div
                    className={cn('bg-foreground/60', ponto.estourados === 0 && 'rounded-t-[3px]')}
                    style={{ height: `${(noPrazo / maximo) * ALTURA}px` }}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
      <div className={cn('mt-1.5 flex', espaco)}>
        {rotulos.map((rotulo, i) => (
          <span
            key={serie.pontos[i].inicio}
            className="min-w-0 flex-1 overflow-hidden text-center font-mono text-[10px] font-medium whitespace-nowrap text-apoio"
          >
            {rotulo}
          </span>
        ))}
      </div>
    </SurfaceCard>
  )
}
