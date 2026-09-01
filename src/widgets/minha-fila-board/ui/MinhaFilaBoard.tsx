import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useConcluidosHoje, useMinhaFila, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { useTiposAto } from '@/entities/tipoAto'
import { useConcluirConferencia } from '@/features/minha-fila/concluir-conferencia'
import { useIniciarConferencia } from '@/features/minha-fila/iniciar-conferencia'
import { usePegarProtocolo } from '@/features/minha-fila/pegar-protocolo'
import { useNow } from '@/shared/lib/use-now'
import { BarraDeFiltros, useFiltroProtocolos } from '@/widgets/filtro-protocolos'

import { ConcluidosHojeList } from './ConcluidosHojeList'
import { EmConferenciaCard } from './EmConferenciaCard'
import { ProtocoloCard } from './ProtocoloCard'

const LEGENDA = [
  { label: 'no prazo', className: 'bg-ok-bg border-ok-border-2' },
  { label: 'atenção', className: 'bg-warn-bg-2 border-warn-border-2' },
  { label: 'crítico', className: 'bg-crit-bg-2 border-crit-border' },
  { label: 'vencido', className: 'bg-bad-bg-2 border-bad-border-2' },
]

// Board de 3 colunas (RF-19 a RF-24) — pool disponível, atribuídas a você, em conferência (+
// concluídos hoje, aninhado na mesma coluna, igual ao protótipo aprovado).
export const MinhaFilaBoard = () => {
  const { data: fila, isLoading } = useMinhaFila()
  const { data: concluidos } = useConcluidosHoje()
  const { data: escreventes } = useEscreventes()
  const { data: equipes } = useEquipes()
  const { data: tiposAto } = useTiposAto()
  const now = useNow()

  const pegar = usePegarProtocolo()
  const iniciar = useIniciarConferencia()
  const concluir = useConcluirConferencia()

  // RF-24f: mesmos 4 eixos de Distribuição, aplicados nas três colunas ao mesmo tempo. O
  // card de Minha fila não mostra tipo/escrevente/equipe (RF-14 é só de Distribuição — ver
  // CLAUDE.md), mas o filtro ainda precisa desse dado pra filtrar por ele.
  const escreventePorId = new Map((escreventes ?? []).map((e) => [e.id, e]))
  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const resolverInfoProtocolo = (protocolo: ProtocoloResumo): InfoProtocolo => {
    const escrevente = escreventePorId.get(protocolo.escreventeId)
    return {
      tipoAtoNome: null,
      escreventeNome: escrevente?.nome ?? null,
      equipeId: escrevente?.equipeId ?? null,
      equipeNome: escrevente?.equipeId ? (nomePorEquipeId.get(escrevente.equipeId) ?? null) : null,
    }
  }
  const todosOsProtocolos = fila ? [...fila.poolDisponivel, ...fila.atribuidos, ...fila.emConferencia] : []
  const filtroProtocolos = useFiltroProtocolos({
    protocolos: todosOsProtocolos,
    resolverInfo: resolverInfoProtocolo,
    equipes: equipes ?? [],
    tiposAto: tiposAto ?? [],
  })

  if (isLoading || !fila) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const erro = pegar.error ?? iniciar.error ?? concluir.error
  const { passaNoFiltro } = filtroProtocolos
  const filaFiltrada = {
    poolDisponivel: fila.poolDisponivel.filter(passaNoFiltro),
    atribuidos: fila.atribuidos.filter(passaNoFiltro),
    emConferencia: fila.emConferencia.filter(passaNoFiltro),
  }

  return (
    <div>
      {erro && <p className="mb-3 text-[13px] text-bad-fg">Não foi possível concluir a ação. Tente de novo.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="font-mono text-[11.5px] text-muted-foreground">Prazo do ato</span>
          {LEGENDA.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
              <span className={`block size-2.5 flex-none rounded-[3px] border ${item.className}`} />
              {item.label}
            </span>
          ))}
        </div>
        <BarraDeFiltros {...filtroProtocolos} />
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Pool disponível</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.poolDisponivel.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {filaFiltrada.poolDisponivel.map((protocolo) => (
              <ProtocoloCard
                key={protocolo.id}
                protocolo={protocolo}
                now={now}
                acaoLabel="Pegar este"
                onAcao={() => pegar.mutate(protocolo.id)}
                acaoDesabilitada={pegar.isPending}
              />
            ))}
            {filaFiltrada.poolDisponivel.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada no pool dentro da sua alçada
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Atribuídas a você</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.atribuidos.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {filaFiltrada.atribuidos.map((protocolo) => (
              <ProtocoloCard
                key={protocolo.id}
                protocolo={protocolo}
                now={now}
                acaoLabel="Iniciar conferência"
                acaoVariante="default"
                onAcao={() => iniciar.mutate(protocolo.id)}
                acaoDesabilitada={iniciar.isPending}
              />
            ))}
            {filaFiltrada.atribuidos.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada atribuído a você
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Em conferência</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.emConferencia.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {filaFiltrada.emConferencia.map((protocolo) => (
              <EmConferenciaCard
                key={protocolo.id}
                protocolo={protocolo}
                now={now}
                onAprovar={() => concluir.mutate({ protocoloId: protocolo.id, aprovado: true })}
                onReprovar={() => concluir.mutate({ protocoloId: protocolo.id, aprovado: false })}
                desabilitado={concluir.isPending}
              />
            ))}
            {filaFiltrada.emConferencia.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada em conferência — pegue um do pool
              </div>
            )}
          </div>

          {concluidos && <ConcluidosHojeList concluidos={concluidos} now={now} />}
        </div>
      </div>
    </div>
  )
}
