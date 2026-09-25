import type { MeuTempoPorTipo } from '@/entities/dashboard'
import { cn } from '@/shared/lib/utils'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { linhasDoTempoPorTipo } from '../lib/ritmo'

// RF-46b — "Seu tempo por tipo de ato": cada tipo que o conferente conferiu no período contra a
// referência da casa pra ele mesmo (barra "você" com o marcador da referência), como no protótipo.
// A frase no fim explica por que o ritmo não é o tempo bruto.
export const TempoPorTipoCard = ({ tipos, explicacao }: { tipos: MeuTempoPorTipo[]; explicacao: string | null }) => {
  const linhas = linhasDoTempoPorTipo(tipos)

  return (
    <SurfaceCard className="mt-2 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-[13.5px] font-semibold">Seu tempo por tipo de ato</div>
          <div className="mt-0.75 max-w-[62ch] text-[11.5px] text-pretty text-apoio">
            Cada tipo comparado com a referência da casa para ele mesmo — inventário com inventário, venda e compra com
            venda e compra.
          </div>
        </div>
        <div className="flex gap-3.5 text-[11.5px] text-text-2">
          <span className="flex items-center gap-1.5">
            <span className="block h-1.5 w-3 rounded-full bg-text-2" />
            você
          </span>
          <span className="flex items-center gap-1.5">
            <span className="block h-[11px] w-0.5 rounded-[1px] bg-foreground" />
            referência
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          <div className="flex gap-3 border-b border-secondary pt-3.5 pb-1.5 text-[10.5px] font-medium text-apoio">
            <span className="w-[150px] flex-none">Tipo de ato</span>
            <span className="w-10 flex-none text-right">Atos</span>
            <span className="min-w-[60px] flex-1" />
            <span className="w-14 flex-none text-right">Você</span>
            <span className="w-14 flex-none text-right">Ref.</span>
            <span className="w-16 flex-none text-right">Diferença</span>
          </div>
          {linhas.map((l) => (
            <div key={l.tipoAtoId} className="flex items-center gap-3 border-b border-secondary py-2.25">
              <span className="w-[150px] flex-none text-[13px] text-pretty">{l.nome}</span>
              <span className="w-10 flex-none text-right font-mono text-[12px] font-medium text-apoio">{l.atos}</span>
              <span className="relative block h-1.5 min-w-[60px] flex-1 rounded-full bg-secondary">
                <span
                  className="absolute top-0 left-0 block h-1.5 rounded-full bg-text-2"
                  style={{ width: `${l.larguraPct}%` }}
                />
                <span
                  className="absolute -top-0.75 block h-3 w-0.5 rounded-[1px] bg-foreground"
                  style={{ left: `${l.referenciaPct}%` }}
                  aria-hidden
                />
              </span>
              <span className="w-14 flex-none text-right font-mono text-[12.5px] font-semibold">
                {l.meuMinutos} min
              </span>
              <span className="w-14 flex-none text-right font-mono text-[12.5px] font-medium text-apoio">
                {l.referenciaMinutos} min
              </span>
              <span className={cn('w-16 flex-none text-right font-mono text-[12px] font-medium', l.classe)}>
                {l.diferenca}
              </span>
            </div>
          ))}
        </div>
      </div>
      {explicacao && <p className="mt-3 text-[12px] leading-[1.55] text-pretty text-text-2">{explicacao}</p>}
    </SurfaceCard>
  )
}
