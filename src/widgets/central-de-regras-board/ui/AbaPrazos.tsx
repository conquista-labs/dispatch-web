import { useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useMoverParaEquipe } from '@/features/escrevente/mover-para-equipe'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'

import { EquipeCard } from './EquipeCard'
import { NovaEquipeDialog } from './NovaEquipeDialog'
import { NovoEscreventeDialog } from './NovoEscreventeDialog'
import { fraseDoPrazo, separarPorPrazoPadrao } from '../lib/prazo-em-vigor'
import { SeletorMultiplo } from './SeletorMultiplo'

// RF-35 a RF-38 — equipes, prazo por etapa e alocação de escreventes órfãos.
export const AbaPrazos = () => {
  const { data: equipes } = useEquipes()
  const { data: escreventes } = useEscreventes()
  const mover = useMoverParaEquipe()

  // Lista, não mais um id só — pedido do dono: selecionar vários escreventes de uma vez (órfãos
  // ou já em outra equipe) e mover todos pra mesma equipe de destino num clique só.
  const [selecionadosIds, setSelecionadosIds] = useState<string[]>([])
  const [padraoAberto, setPadraoAberto] = useState(false)

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
  const { padrao, proprias } = separarPorPrazoPadrao(equipes)
  const padraoExpandido = padraoAberto || selecionadosIds.length > 0

  const renderizarEquipe = (equipe: (typeof equipes)[number]) => (
    <EquipeCard
      key={equipe.id}
      equipe={equipe}
      escreventes={escreventes.filter((e) => e.equipeId === equipe.id)}
      selecionadosIds={selecionadosIds}
      onSelecionarEscrevente={toggleSelecao}
      onMoverParaCa={() => handleMoverParaCa(equipe.id)}
      movendo={mover.isPending}
    />
  )

  return (
    <div className="max-w-[960px]">
      {/* No celular o título e a descrição ficavam numa coluna de ~110px ao lado dos dois botões, uma
          palavra por linha; abaixo de 760px os botões descem pra baixo do texto, como no protótipo. */}
      <header className="flex items-start justify-between gap-4 max-mobile:flex-col max-mobile:gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold tracking-[-0.015em]">Prazo por equipe e etapa</h2>
          <p className="mt-1.5 max-w-[66ch] text-[13px] text-pretty text-text-2">
            O prazo não vem no relatório: sai daqui. Na importação o sistema lê o escrevente, descobre a equipe dele e
            aplica o prazo combinado — um para pré-conferência, outro para pós.
          </p>
        </div>
        <div className="flex flex-none gap-2">
          <NovoEscreventeDialog />
          <NovaEquipeDialog />
        </div>
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
              vazioLabel="Escolher escreventes…"
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

      {/* Protótipo v2: as equipes no prazo mais comum ficam recolhidas num card só — com ~30 equipes,
          a lista inteira escondia as poucas que fogem do padrão. Abre sozinho quando há escrevente
          selecionado pra mover (a equipe de destino pode estar no padrão). */}
      {padrao.length > 0 && (
        <div className="mt-3.5 rounded-[10px] border border-border bg-card">
          <button
            type="button"
            onClick={() => setPadraoAberto(!padraoAberto)}
            aria-expanded={padraoExpandido}
            className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 p-3.5 text-left hover:bg-secondary/60"
          >
            <span className="min-w-0">
              {/* Protótipo v2: o prazo vira uma pílula ao lado da contagem, em vez de título corrido. */}
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] font-semibold">{padrao.length} equipes no padrão</span>
                <span className="rounded-full border border-border bg-secondary px-2 py-px font-mono text-[11px] font-medium text-text-3">
                  {fraseDoPrazo(padrao[0])}
                </span>
              </span>
              <span className="mt-0.5 block text-[12px] text-pretty text-apoio">
                {padrao
                  .slice(0, 6)
                  .map((e) => e.nome)
                  .join(', ')}
                {padrao.length > 6 ? ` e mais ${padrao.length - 6}` : ''}
              </span>
            </span>
            <span className="flex h-7 flex-none items-center rounded-md border border-border bg-card px-2.5 text-[12px] font-medium text-text-2">
              {padraoExpandido ? 'recolher' : 'ver e ajustar'}
            </span>
          </button>
          {padraoExpandido && (
            <div className="grid grid-cols-2 gap-2 border-t border-secondary p-2 max-mobile:grid-cols-1">
              {padrao.map(renderizarEquipe)}
            </div>
          )}
        </div>
      )}

      {proprias.length > 0 && (
        <>
          {padrao.length > 0 && (
            <div className="mt-5 mb-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="text-[13px] font-semibold">
                {proprias.length === 1 ? '1 equipe com prazo próprio' : `${proprias.length} equipes com prazo próprio`}
              </span>
              <span className="text-[11.5px] text-muted-foreground">
                as que fogem do padrão — são estas que merecem atenção
              </span>
            </div>
          )}
          <div className={cn('grid grid-cols-2 gap-2 max-mobile:grid-cols-1', padrao.length === 0 && 'mt-3.5')}>
            {proprias.map(renderizarEquipe)}
          </div>
        </>
      )}
      <p className="mt-3.5 text-[12.5px] text-pretty text-muted-foreground">
        Mudar um prazo aqui recalcula o vencimento dos protocolos abertos daquela equipe — o semáforo se ajusta na hora.
      </p>
    </div>
  )
}
