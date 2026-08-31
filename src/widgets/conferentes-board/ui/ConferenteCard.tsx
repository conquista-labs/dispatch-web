import { MinusIcon, PlusIcon } from 'lucide-react'

import type { Conferente, Nivel } from '@/entities/conferente'
import { NIVEL_LABEL } from '@/entities/conferente'
import { useEditarNivelEJornada } from '@/features/conferente/editar-nivel-jornada'
import { useMarcarPresenca } from '@/features/conferente/marcar-presenca'
import { useRemoverConferente } from '@/features/conferente/remover'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { EditarConferenteDialog } from './EditarConferenteDialog'

const PROXIMO_NIVEL: Record<Nivel, Nivel> = { Junior: 'Pleno', Pleno: 'Senior', Senior: 'Junior' }

const JORNADA_MIN = 2
const JORNADA_MAX = 12

type ConferenteCardProps = {
  conferente: Conferente
  tiposAlcancados: number | null
}

// RF-25 a RF-29 — um card por conferente. Nível/jornada editam direto no card (stepper/pill,
// igual o protótipo). Nome/e-mail são um agregado separado no back (Usuario, não Conferente) —
// abrem um modal próprio (EditarConferenteDialog, mesmo padrão do "Novo conferente").
export const ConferenteCard = ({ conferente, tiposAlcancados }: ConferenteCardProps) => {
  const editarNivelEJornada = useEditarNivelEJornada()
  const marcarPresenca = useMarcarPresenca()
  const remover = useRemoverConferente()

  const ocupacao = conferente.capacidadeEstimada > 0 ? conferente.cargaAtual / conferente.capacidadeEstimada : 0
  const corCarga = !conferente.naEscala
    ? 'text-muted-foreground'
    : conferente.cargaAtual >= conferente.capacidadeEstimada
      ? 'text-bad-fg'
      : ocupacao > 0.75
        ? 'text-crit-fg'
        : 'text-foreground'

  const mexerJornada = (delta: number) => {
    const nova = Math.min(JORNADA_MAX, Math.max(JORNADA_MIN, conferente.jornadaHoras + delta))
    if (nova === conferente.jornadaHoras) return
    editarNivelEJornada.mutate({ conferenteId: conferente.id, nivel: conferente.nivel, jornadaHoras: nova })
  }

  const ciclarNivel = () =>
    editarNivelEJornada.mutate({ conferenteId: conferente.id, nivel: PROXIMO_NIVEL[conferente.nivel], jornadaHoras: conferente.jornadaHoras })

  return (
    <SurfaceCard data-testid={`conferente-card-${conferente.id}`} className={cn('p-3.5 px-4', !conferente.naEscala && 'bg-secondary/40')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-1.5">
          {/* RNF-10: nome/e-mail não truncam — dois conferentes parecidos ("Ana Silva"/"Ana
              Souza") não podem virar "Ana S..." indistinguível nessa lista. */}
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-pretty">{conferente.nome}</div>
            <div className="font-mono text-[11.5px] break-words text-muted-foreground">{conferente.email}</div>
          </div>
          <div className="mt-0.5">
            <EditarConferenteDialog conferente={conferente} />
          </div>
        </div>

        <div className="flex flex-none items-center gap-2.5">
          <div className="text-right">
            <div className={cn('font-mono text-[13.5px] font-medium', corCarga)}>
              {conferente.cargaAtual}/{conferente.capacidadeEstimada}
            </div>
            <div className="text-[10px] text-muted-foreground">na mão · capacidade</div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={conferente.naEscala ? 'border-ok-border bg-ok-bg text-ok-fg hover:bg-ok-bg' : undefined}
            onClick={() => marcarPresenca.mutate({ conferenteId: conferente.id, presente: !conferente.naEscala })}
            disabled={marcarPresenca.isPending}
          >
            {conferente.naEscala ? 'Na escala' : 'Ausente'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hover:border-bad-border hover:bg-bad-bg hover:text-bad-fg"
            onClick={() => remover.mutate(conferente.id)}
            disabled={remover.isPending}
          >
            Remover
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <span className="text-[12px] font-medium text-text-2">Jornada</span>
        <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => mexerJornada(-1)}
            className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
          >
            <MinusIcon className="size-3" />
          </button>
          <span className="min-w-[34px] text-center font-mono text-[12.5px] font-medium">{conferente.jornadaHoras}h</span>
          <button
            type="button"
            onClick={() => mexerJornada(1)}
            className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
          >
            <PlusIcon className="size-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={ciclarNivel}
          className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[12px] font-medium hover:bg-muted"
        >
          Analista {NIVEL_LABEL[conferente.nivel]}
        </button>

        {tiposAlcancados !== null && <span className="text-[11.5px] text-muted-foreground">pode conferir {tiposAlcancados} tipos de ato</span>}
      </div>
    </SurfaceCard>
  )
}
