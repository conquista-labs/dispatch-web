import { useEffect, useState } from 'react'

import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'
import { TIPO_PRAZO_LABEL } from '@/entities/protocolo'
import type { TipoPrazo } from '@/entities/protocolo'
import { useEditarEquipe } from '@/features/equipe/editar'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { PillToggle } from './PillToggle'

const TIPOS_PRAZO = Object.keys(TIPO_PRAZO_LABEL) as TipoPrazo[]

type EquipeCardProps = {
  equipe: Equipe
  escreventes: Escrevente[]
  escreventeSelecionadoId: string | null
  onSelecionarEscrevente: (id: string) => void
  onMoverParaCa: () => void
}

// RF-35/RF-36 — nome edita inline (commit no blur, evita um PUT por tecla já que o back
// recalcula vencimento a cada troca de prazo — RF-38), prazo pré/pós edita direto pelos pills.
export const EquipeCard = ({ equipe, escreventes, escreventeSelecionadoId, onSelecionarEscrevente, onMoverParaCa }: EquipeCardProps) => {
  const [nome, setNome] = useState(equipe.nome)
  const editar = useEditarEquipe()

  useEffect(() => setNome(equipe.nome), [equipe.nome])

  const commitNome = () => {
    const aparado = nome.trim()
    if (aparado && aparado !== equipe.nome) {
      editar.mutate({ equipeId: equipe.id, nome: aparado, prazoPreConferencia: equipe.prazoPreConferencia, prazoPosConferencia: equipe.prazoPosConferencia })
    } else {
      setNome(equipe.nome)
    }
  }

  const alterarPrazo = (campo: 'prazoPreConferencia' | 'prazoPosConferencia', valor: TipoPrazo) => {
    editar.mutate({
      equipeId: equipe.id,
      nome: equipe.nome,
      prazoPreConferencia: campo === 'prazoPreConferencia' ? valor : equipe.prazoPreConferencia,
      prazoPosConferencia: campo === 'prazoPosConferencia' ? valor : equipe.prazoPosConferencia,
    })
  }

  const mostrarMover = escreventeSelecionadoId !== null && !escreventes.some((e) => e.id === escreventeSelecionadoId)

  return (
    <SurfaceCard className="p-3.5">
      <div className="flex items-start justify-between gap-2.5">
        <input
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          onBlur={commitNome}
          className="-ml-1.5 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[14px] font-semibold text-foreground outline-none hover:border-border focus:border-foreground focus:bg-card"
        />
        <span className="flex-none rounded-full bg-secondary px-1.75 py-0.25 font-mono text-[11px] whitespace-nowrap text-text-3">
          {escreventes.length} escreventes
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="w-[74px] flex-none text-[11.5px] font-medium text-text-2">Pré-conf.</span>
        <div className="flex flex-wrap gap-1">
          {TIPOS_PRAZO.map((tipo) => (
            <PillToggle
              key={tipo}
              label={TIPO_PRAZO_LABEL[tipo]}
              selecionado={equipe.prazoPreConferencia === tipo}
              onClick={() => alterarPrazo('prazoPreConferencia', tipo)}
            />
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-[74px] flex-none text-[11.5px] font-medium text-text-2">Pós-conf.</span>
        <div className="flex flex-wrap gap-1">
          {TIPOS_PRAZO.map((tipo) => (
            <PillToggle
              key={tipo}
              label={TIPO_PRAZO_LABEL[tipo]}
              selecionado={equipe.prazoPosConferencia === tipo}
              onClick={() => alterarPrazo('prazoPosConferencia', tipo)}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-secondary pt-3">
        {escreventes.length === 0 && <span className="text-xs text-muted-foreground">nenhum escrevente nesta equipe</span>}
        {escreventes.map((esc) => (
          <PillToggle
            key={esc.id}
            redondo
            label={esc.nome}
            selecionado={escreventeSelecionadoId === esc.id}
            onClick={() => onSelecionarEscrevente(esc.id)}
          />
        ))}
      </div>
      {mostrarMover && (
        <button
          onClick={onMoverParaCa}
          className="mt-2.5 w-full rounded-md border border-dashed border-foreground bg-card py-1.5 text-[12.5px] font-medium hover:bg-secondary"
        >
          Mover para cá
        </button>
      )}
    </SurfaceCard>
  )
}
