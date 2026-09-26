import { MinusIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { rotuloAnalista, type Conferente, type Nivel } from '@/entities/conferente'
import { SeloSoAdministracao, useEhAdministrador } from '@/entities/usuario'
import { useEditarNivelEJornada } from '@/features/conferente/editar-nivel-jornada'
import { useMarcarPresenca } from '@/features/conferente/marcar-presenca'
import { useRemoverConferente } from '@/features/conferente/remover'
import { ROUTES } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { EditarConferenteDialog } from './EditarConferenteDialog'

const PROXIMO_NIVEL: Record<Nivel, Nivel> = { Junior: 'Pleno', Pleno: 'Senior', Senior: 'Junior' }

const JORNADA_MIN = 2
const JORNADA_MAX = 12

// Até 3 pills de regra por card (mesmo limite do protótipo aprovado) — o resto vira um "+N
// regras" que manda pra Central de Regras ver a lista inteira.
const MAX_PILLS_DE_ALCADA = 3

type ConferenteCardProps = {
  conferente: Conferente
  tiposAlcancados: number | null
  totalTipos: number | null
  frasesDeAlcada: string[]
}

// RF-25 a RF-29 — um card por conferente. Nível/jornada editam direto no card (stepper/pill,
// igual o protótipo). Nome/e-mail são um agregado separado no back (Usuario, não Conferente) —
// abrem um modal próprio (EditarConferenteDialog, mesmo padrão do "Novo conferente").
// RF-29a: pra distribuidora (não admin) o card vira só presença — sem editar, sem remover, sem
// cargo (o back nem manda o nível); jornada aparece como texto.
export const ConferenteCard = ({ conferente, tiposAlcancados, totalTipos, frasesDeAlcada }: ConferenteCardProps) => {
  const ehAdministrador = useEhAdministrador()
  const editarNivelEJornada = useEditarNivelEJornada()
  const marcarPresenca = useMarcarPresenca()
  const remover = useRemoverConferente()

  const ocupacao = conferente.capacidadeEstimada > 0 ? conferente.cargaAtual / conferente.capacidadeEstimada : 0
  const corCarga = conferente.naEscala
    ? conferente.cargaAtual >= conferente.capacidadeEstimada
      ? 'text-bad-fg'
      : ocupacao > 0.75
        ? 'text-crit-fg'
        : 'text-foreground'
    : 'text-muted-foreground'

  // Os dois só existem na visão do admin, que sempre recebe o nível.
  const mexerJornada = (delta: number) => {
    const nova = Math.min(JORNADA_MAX, Math.max(JORNADA_MIN, conferente.jornadaHoras + delta))
    if (nova === conferente.jornadaHoras || !conferente.nivel) return
    editarNivelEJornada.mutate({ conferenteId: conferente.id, nivel: conferente.nivel, jornadaHoras: nova })
  }

  const ciclarNivel = () => {
    if (!conferente.nivel) return
    editarNivelEJornada.mutate({
      conferenteId: conferente.id,
      nivel: PROXIMO_NIVEL[conferente.nivel],
      jornadaHoras: conferente.jornadaHoras,
    })
  }

  // Mesmo texto do protótipo aprovado (prefLabel): "todos os M" quando alcança o catálogo
  // inteiro, "N de M" caso contrário.
  const prefLabel =
    tiposAlcancados === null || totalTipos === null
      ? null
      : tiposAlcancados === totalTipos
        ? `pode conferir todos os ${totalTipos} tipos de ato`
        : `pode conferir ${tiposAlcancados} de ${totalTipos} tipos de ato`

  const pills = frasesDeAlcada.slice(0, MAX_PILLS_DE_ALCADA)
  const resto = frasesDeAlcada.length - pills.length

  return (
    <SurfaceCard
      data-testid={`conferente-card-${conferente.id}`}
      className={cn('p-3.5 px-4', !conferente.naEscala && 'bg-secondary/40')}
    >
      {/* flex-wrap: no celular o bloco da direita (carga, presença, remover) desce pra linha de baixo
          em vez de espremer nome e e-mail até 1 caractere por linha (achado da auditoria visual). */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2.5">
        <div className="flex min-w-0 flex-[1_1_220px] items-start gap-1.5">
          {/* RNF-10: nome/e-mail não truncam — dois conferentes parecidos ("Ana Silva"/"Ana
              Souza") não podem virar "Ana S..." indistinguível nessa lista. */}
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold text-pretty">{conferente.nome}</div>
            <div className="font-mono text-[11.5px] break-words text-muted-foreground">{conferente.email}</div>
          </div>
          {ehAdministrador && (
            <div className="mt-0.5">
              <EditarConferenteDialog conferente={conferente} />
            </div>
          )}
        </div>

        <div className="flex flex-none items-center gap-2.5 max-mobile:w-full">
          <div className="text-right">
            <div className={cn('font-mono text-[15px] font-medium', corCarga)}>
              {conferente.cargaAtual}/{conferente.capacidadeEstimada}
            </div>
            <div className="text-[10px] text-muted-foreground">na mão · capacidade</div>
          </div>

          {/* Presença em pílula, como no protótipo v2: verde "Na escala", neutra "Ausente". */}
          <button
            type="button"
            className={cn(
              'rounded-full border px-[11px] py-1 text-[12px] font-medium whitespace-nowrap hover:border-muted-foreground disabled:opacity-50 max-mobile:min-h-11 max-mobile:px-3.5',
              conferente.naEscala ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
            )}
            onClick={() => marcarPresenca.mutate({ conferenteId: conferente.id, presente: !conferente.naEscala })}
            disabled={marcarPresenca.isPending}
          >
            {conferente.naEscala ? 'Na escala' : 'Ausente'}
          </button>

          {ehAdministrador && (
            <Button
              variant="outline"
              size="sm"
              className="bg-card text-[12px] text-text-2 hover:border-bad-border hover:bg-bad-bg hover:text-bad-fg"
              onClick={() => remover.mutate(conferente.id)}
              disabled={remover.isPending}
            >
              Remover
            </Button>
          )}
        </div>
      </div>

      {ehAdministrador ? (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="text-[12px] font-medium text-text-2">Jornada</span>
          <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
            <button
              type="button"
              aria-label="Diminuir jornada"
              onClick={() => mexerJornada(-1)}
              className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="min-w-[34px] text-center font-mono text-[12.5px] font-medium">
              {conferente.jornadaHoras}h
            </span>
            <button
              type="button"
              aria-label="Aumentar jornada"
              onClick={() => mexerJornada(1)}
              className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
            >
              <PlusIcon className="size-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={ciclarNivel}
            className="rounded-full border border-border bg-card px-2.5 py-[3px] text-[11.5px] font-medium text-text-5 hover:border-muted-foreground"
          >
            {rotuloAnalista(conferente.nivel)}
          </button>

          {prefLabel && <span className="text-[11.5px] text-muted-foreground">{prefLabel}</span>}
          <SeloSoAdministracao />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="text-[12px] font-medium text-text-2">Jornada {conferente.jornadaHoras}h</span>
          {prefLabel && <span className="text-[11.5px] text-muted-foreground">{prefLabel}</span>}
        </div>
      )}

      {pills.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-text-2">Alçada</span>
          {pills.map((frase, indice) => (
            <span
              key={indice}
              className="rounded-full border border-secondary bg-background px-2 py-px text-[11.5px] text-pretty text-text-3"
            >
              {frase}
            </span>
          ))}
          {resto > 0 && (
            <Link
              to={ROUTES.centralDeRegras}
              className="text-[11px] font-medium text-muted-foreground underline decoration-dotted hover:text-foreground"
            >
              +{resto} {resto === 1 ? 'regra' : 'regras'}
            </Link>
          )}
        </div>
      )}
    </SurfaceCard>
  )
}
