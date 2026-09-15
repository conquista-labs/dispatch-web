import { useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useMoverParaEquipe } from '@/features/escrevente/mover-para-equipe'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'

import { EquipeCard } from './EquipeCard'
import { NovaEquipeDialog } from './NovaEquipeDialog'
import { SeletorMultiplo } from './SeletorMultiplo'

// RF-35 a RF-38 — equipes, prazo por etapa e alocação de escreventes órfãos.
export const AbaPrazos = () => {
  const { data: equipes } = useEquipes()
  const { data: escreventes } = useEscreventes()
  const mover = useMoverParaEquipe()

  // Lista, não mais um id só — pedido do dono: selecionar vários escreventes de uma vez (órfãos
  // ou já em outra equipe) e mover todos pra mesma equipe de destino num clique só.
  const [selecionadosIds, setSelecionadosIds] = useState<string[]>([])

  if (!equipes || !escreventes) {
    return <Carregando />
  }

  // Derivado localmente em vez de um segundo GET (/escreventes/sem-equipe) — `escreventes` já
  // trouxe tudo, e é o mesmo filtro que AbaRegrasEmVigor.tsx já faz (achado de auditoria de
  // over-fetching: os dois endpoints traziam informação sobreposta).
  const semEquipe = escreventes.filter((e) => !e.equipeId)

  const toggleSelecao = (id: string) =>
    setSelecionadosIds((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))

  const handleMoverParaCa = async (equipeId: string) => {
    if (selecionadosIds.length === 0) return
    // Um PUT por escrevente (não existe endpoint de mover em lote) — em paralelo, mesma UX de
    // "uma ação só" pro usuário; cada mutation invalida a lista de escreventes ao terminar.
    await Promise.all(selecionadosIds.map((escreventeId) => mover.mutateAsync({ escreventeId, equipeId })))
    setSelecionadosIds([])
  }

  const nomesSelecionados = escreventes.filter((e) => selecionadosIds.includes(e.id)).map((e) => e.nome)

  return (
    <div className="max-w-[960px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-5.5 mb-0 text-[15px] font-semibold tracking-[-0.01em]">Prazo por equipe e etapa</h2>
          <p className="mt-1.5 max-w-[66ch] text-[13px] text-pretty text-text-2">
            O prazo não vem no relatório: sai daqui. Na importação o sistema lê o escrevente, descobre a equipe dele e
            aplica o prazo combinado — um para pré-conferência, outro para pós.
          </p>
        </div>
        <NovaEquipeDialog />
      </header>

      {semEquipe.length > 0 && (
        <div className="mt-4.5 rounded-[10px] border border-warn-border bg-warn-bg p-3.5">
          <div className="text-[13px] font-semibold text-warn-fg-2">Escreventes sem equipe</div>
          <div className="mt-0.75 text-[12.5px] text-warn-fg">
            Os protocolos deles entram com o prazo padrão D+1. Selecione um ou mais nomes e mova para a equipe certa.
          </div>
          {/* RNF-11 — combobox com busca (protótipo reexportado: dc-import Combo, "buscar
              escrevente…"), não mais pills — a lista de órfãos cresce junto com o cartório.
              Multi-seleção: mover vários órfãos pra mesma equipe de uma vez é o caso comum. */}
          <div className="mt-2.5">
            <SeletorMultiplo
              selecionados={selecionadosIds.filter((id) => semEquipe.some((e) => e.id === id))}
              opcoes={semEquipe.map((esc) => ({ valor: esc.id, label: esc.nome }))}
              onAlternar={toggleSelecao}
              placeholder="buscar escrevente…"
            />
          </div>
        </div>
      )}

      {selecionadosIds.length > 0 && (
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[10px] border border-foreground bg-card p-3">
          <span className="text-[13px] text-pretty">
            <strong className="font-semibold">
              {nomesSelecionados.length === 1 ? nomesSelecionados[0] : `${nomesSelecionados.length} escreventes`}
            </strong>{' '}
            selecionado{nomesSelecionados.length > 1 ? 's' : ''} — clique em “Mover para cá” na equipe de destino.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelecionadosIds([])}
            disabled={mover.isPending}
            className="flex-none"
          >
            Cancelar
          </Button>
        </div>
      )}

      <div className="mt-3.5 grid grid-cols-2 gap-2 max-mobile:grid-cols-1">
        {equipes.map((equipe) => (
          <EquipeCard
            key={equipe.id}
            equipe={equipe}
            escreventes={escreventes.filter((e) => e.equipeId === equipe.id)}
            selecionadosIds={selecionadosIds}
            onSelecionarEscrevente={toggleSelecao}
            onMoverParaCa={() => handleMoverParaCa(equipe.id)}
            movendo={mover.isPending}
          />
        ))}
      </div>
      <p className="mt-3.5 text-[12.5px] text-pretty text-muted-foreground">
        Mudar um prazo aqui recalcula o vencimento dos protocolos abertos daquela equipe — o semáforo se ajusta na hora.
      </p>
    </div>
  )
}
