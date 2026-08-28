import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAlcance, useConferentes, type Conferente, type Nivel } from '@/entities/conferente'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { FilaDoConferenteBoard } from '@/widgets/fila-do-conferente-board'

const NIVEL_LABEL: Record<Nivel, string> = { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' }

// RF-19 — protótipo aprovado tem "Minha fila" no menu de quem é gestão também: pra Conferente
// é a própria fila, pra Distribuidora é a fila de quem ela escolher. Sempre somente leitura —
// RNF-04, os endpoints de ação nem aceitam chamada de quem não é o próprio Conferente.
export const FilaConferentesPage = () => {
  const { data: conferentes } = useConferentes()
  const { data: alcance } = useAlcance()
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  useEffect(() => {
    if (!selecionadoId && conferentes && conferentes.length > 0) {
      const primeiroNaEscala = conferentes.find((c) => c.naEscala) ?? conferentes[0]
      setSelecionadoId(primeiroNaEscala.id)
    }
  }, [conferentes, selecionadoId])

  const selecionado = conferentes?.find((c) => c.id === selecionadoId)
  const alcanceSelecionado = alcance?.find((a) => a.conferenteId === selecionadoId)

  return (
    <div className="px-7 pt-6 pb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Minha fila</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            {selecionado
              ? `${selecionado.nome} · Analista ${NIVEL_LABEL[selecionado.nivel]}${
                  alcanceSelecionado ? ` · pode conferir ${alcanceSelecionado.tiposPermitidosIds.length} tipos de ato` : ''
                }`
              : 'Escolha um conferente pra acompanhar a fila.'}
          </p>
        </div>

        {conferentes && conferentes.length > 0 && (
          <SeletorConferente conferentes={conferentes} selecionadoId={selecionadoId} onSelecionar={setSelecionadoId} />
        )}
      </div>

      <div className="mt-5">
        {selecionadoId ? (
          <FilaDoConferenteBoard conferenteId={selecionadoId} />
        ) : (
          <p className="text-[13.5px] text-muted-foreground">Nenhum conferente cadastrado ainda.</p>
        )}
      </div>
    </div>
  )
}

type SeletorConferenteProps = {
  conferentes: Conferente[]
  selecionadoId: string | null
  onSelecionar: (id: string) => void
}

// Mesmo padrão do seletor de "Etapa" em Importar (Popover + trigger de duas linhas + lista com
// indicador de seleção) — o protótipo aprovado trocou o antigo botão "Ver como outro
// conferente" (ciclava um por vez) por esse dropdown de verdade, com nível/carga por linha.
const SeletorConferente = ({ conferentes, selecionadoId, onSelecionar }: SeletorConferenteProps) => {
  const [aberto, setAberto] = useState(false)
  const selecionado = conferentes.find((c) => c.id === selecionadoId)

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-[216px] items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left hover:border-muted-foreground/40"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[10px] font-medium tracking-[0.04em] text-muted-foreground">VER COMO</span>
            <span className="mt-px block truncate text-[13px] font-medium">{selecionado?.nome ?? 'Escolher conferente'}</span>
          </span>
          <ChevronDownIcon className="size-4 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-80 w-[262px] overflow-y-auto p-1">
        {conferentes.map((conferente) => {
          const ativo = conferente.id === selecionadoId
          return (
            <button
              key={conferente.id}
              type="button"
              onClick={() => {
                onSelecionar(conferente.id)
                setAberto(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-secondary',
                ativo && 'bg-secondary',
                !conferente.naEscala && 'opacity-55',
              )}
            >
              <span className={cn('flex size-3.5 flex-none items-center justify-center rounded-full border', ativo ? 'border-foreground' : 'border-border')}>
                {ativo && <span className="size-1.5 rounded-full bg-foreground" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{conferente.nome}</span>
                <span className="block text-[11px] text-muted-foreground">
                  Analista {NIVEL_LABEL[conferente.nivel]}
                  {!conferente.naEscala && ' · ausente'}
                </span>
              </span>
              <span className="flex-none font-mono text-[11px] text-text-2">{conferente.cargaAtual}</span>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
