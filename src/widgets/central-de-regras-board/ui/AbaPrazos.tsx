import { useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useMoverParaEquipe } from '@/features/escrevente/mover-para-equipe'
import { Button } from '@/shared/ui/button'

import { EquipeCard } from './EquipeCard'
import { NovaEquipeDialog } from './NovaEquipeDialog'
import { PillToggle } from './PillToggle'

// RF-35 a RF-38 — equipes, prazo por etapa e alocação de escreventes órfãos.
export const AbaPrazos = () => {
  const { data: equipes } = useEquipes()
  const { data: escreventes } = useEscreventes()
  const mover = useMoverParaEquipe()

  const [escreventeSelecionadoId, setEscreventeSelecionadoId] = useState<string | null>(null)

  if (!equipes || !escreventes) {
    return <p className="mt-5 text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  // Derivado localmente em vez de um segundo GET (/escreventes/sem-equipe) — `escreventes` já
  // trouxe tudo, e é o mesmo filtro que AbaRegrasEmVigor.tsx já faz (achado de auditoria de
  // over-fetching: os dois endpoints traziam informação sobreposta).
  const semEquipe = escreventes.filter((e) => !e.equipeId)

  const toggleSelecao = (id: string) => setEscreventeSelecionadoId((atual) => (atual === id ? null : id))

  const handleMoverParaCa = (equipeId: string) => {
    if (!escreventeSelecionadoId) return
    mover.mutate({ escreventeId: escreventeSelecionadoId, equipeId }, { onSuccess: () => setEscreventeSelecionadoId(null) })
  }

  const nomeSelecionado = escreventes.find((e) => e.id === escreventeSelecionadoId)?.nome

  return (
    <div className="max-w-[960px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-5.5 mb-0 text-[15px] font-semibold tracking-[-0.01em]">Prazo por equipe e etapa</h2>
          <p className="mt-1.5 max-w-[66ch] text-[13px] text-text-2 text-pretty">
            O prazo não vem no relatório: sai daqui. Na importação o sistema lê o escrevente, descobre a equipe dele e aplica o prazo combinado — um para
            pré-conferência, outro para pós.
          </p>
        </div>
        <NovaEquipeDialog />
      </header>

      {semEquipe.length > 0 && (
        <div className="mt-4.5 rounded-[10px] border border-warn-border bg-warn-bg p-3.5">
          <div className="text-[13px] font-semibold text-warn-fg-2">Escreventes sem equipe</div>
          <div className="mt-0.75 text-[12.5px] text-warn-fg">Os protocolos deles entram com o prazo padrão D+1. Selecione o nome e mova para a equipe certa.</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {semEquipe.map((esc) => (
              <PillToggle key={esc.id} redondo label={esc.nome} selecionado={escreventeSelecionadoId === esc.id} onClick={() => toggleSelecao(esc.id)} />
            ))}
          </div>
        </div>
      )}

      {escreventeSelecionadoId && (
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[10px] border border-foreground bg-card p-3">
          <span className="text-[13px]">
            <strong className="font-semibold">{nomeSelecionado}</strong> selecionado — clique em “Mover para cá” na equipe de destino.
          </span>
          <Button variant="outline" size="sm" onClick={() => setEscreventeSelecionadoId(null)}>
            Cancelar
          </Button>
        </div>
      )}

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        {equipes.map((equipe) => (
          <EquipeCard
            key={equipe.id}
            equipe={equipe}
            escreventes={escreventes.filter((e) => e.equipeId === equipe.id)}
            escreventeSelecionadoId={escreventeSelecionadoId}
            onSelecionarEscrevente={toggleSelecao}
            onMoverParaCa={() => handleMoverParaCa(equipe.id)}
          />
        ))}
      </div>
      <p className="mt-3.5 text-[12.5px] text-muted-foreground text-pretty">
        Mudar um prazo aqui recalcula o vencimento dos protocolos abertos daquela equipe — o semáforo se ajusta na hora.
      </p>
    </div>
  )
}
