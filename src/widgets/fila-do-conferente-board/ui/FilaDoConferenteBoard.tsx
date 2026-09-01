import { useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useConcluidosHojeDoConferente, useFilaDoConferente, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { useTiposAto } from '@/entities/tipoAto'
import { useNow } from '@/shared/lib/use-now'
import { BarraDeFiltros, useFiltroProtocolos } from '@/widgets/filtro-protocolos'
import { ConcluidosHojeList, EmConferenciaCard, ListaCompletaPoolSheet, ProtocoloCard } from '@/widgets/minha-fila-board'

// Mesmo limite de MinhaFilaBoard/ProtocoloColuna (Distribuição) — truncar em 3 e abrir a
// lista completa num Sheet quando tiver mais.
const MAX_POOL_VISIVEL = 5

const LEGENDA = [
  { label: 'no prazo', className: 'bg-ok-bg border-ok-border-2' },
  { label: 'atenção', className: 'bg-warn-bg-2 border-warn-border-2' },
  { label: 'crítico', className: 'bg-crit-bg-2 border-crit-border' },
  { label: 'vencido', className: 'bg-bad-bg-2 border-bad-border-2' },
]

type FilaDoConferenteBoardProps = {
  conferenteId: string
}

// RF-19 — mesmo board de 3 colunas de "Minha fila", mas pra Distribuidora acompanhar a fila de
// um conferente específico: sempre somenteLeitura (sem Pegar/Iniciar/Aprovar/Reprovar/editar
// observação — RNF-04, a restrição de dono é sempre no servidor, esses endpoints nem aceitam
// chamada de quem não é Conferente; aqui é só visão). Reaproveita os mesmos componentes de
// card de widgets/minha-fila-board — a estrutura visual é idêntica, só o modo muda.
export const FilaDoConferenteBoard = ({ conferenteId }: FilaDoConferenteBoardProps) => {
  const { data: fila, isLoading } = useFilaDoConferente(conferenteId)
  const { data: concluidos } = useConcluidosHojeDoConferente(conferenteId)
  const { data: escreventes } = useEscreventes()
  const { data: equipes } = useEquipes()
  const { data: tiposAto } = useTiposAto()
  const now = useNow()
  const [listaCompletaAberta, setListaCompletaAberta] = useState(false)

  // RF-24f: mesmo filtro de Minha fila — a Distribuidora acompanhando a fila de alguém também
  // se beneficia de filtrar por equipe/tipo/prioridade/prazo.
  const escreventePorId = new Map((escreventes ?? []).map((e) => [e.id, e]))
  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const nomePorTipoAtoId = new Map((tiposAto ?? []).map((t) => [t.id, t.nome]))
  const resolverInfoProtocolo = (protocolo: ProtocoloResumo): InfoProtocolo => {
    const escrevente = escreventePorId.get(protocolo.escreventeId)
    return {
      tipoAtoNome: protocolo.tipoAtoId ? (nomePorTipoAtoId.get(protocolo.tipoAtoId) ?? null) : null,
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
    now,
  })

  if (isLoading || !fila) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const { passaNoFiltro } = filtroProtocolos
  const filaFiltrada = {
    poolDisponivel: fila.poolDisponivel.filter(passaNoFiltro),
    atribuidos: fila.atribuidos.filter(passaNoFiltro),
    emConferencia: fila.emConferencia.filter(passaNoFiltro),
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="font-mono text-[11.5px] text-muted-foreground">Prazo do ato</span>
        {LEGENDA.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
            <span className={`block size-2.5 flex-none rounded-[3px] border ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="mt-3.5">
        <BarraDeFiltros {...filtroProtocolos} subtitulo="aplicados às três colunas da fila dele" />
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Pool disponível</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.poolDisponivel.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {filaFiltrada.poolDisponivel.slice(0, MAX_POOL_VISIVEL).map((protocolo) => (
              <ProtocoloCard key={protocolo.id} protocolo={protocolo} now={now} info={resolverInfoProtocolo(protocolo)} somenteLeitura />
            ))}
            {filaFiltrada.poolDisponivel.length > MAX_POOL_VISIVEL && (
              <button
                type="button"
                onClick={() => setListaCompletaAberta(true)}
                className="rounded-[10px] border border-dashed border-border p-2 text-center text-xs text-muted-foreground hover:border-muted-foreground/40 hover:text-text-2"
              >
                + {filaFiltrada.poolDisponivel.length - MAX_POOL_VISIVEL} protocolos
              </button>
            )}
            {filaFiltrada.poolDisponivel.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada no pool dentro da alçada dele
              </div>
            )}
          </div>
          <ListaCompletaPoolSheet
            aberto={listaCompletaAberta}
            onFechar={() => setListaCompletaAberta(false)}
            protocolos={filaFiltrada.poolDisponivel}
            now={now}
            resolverInfo={resolverInfoProtocolo}
            somenteLeitura
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Atribuídas</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.atribuidos.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {filaFiltrada.atribuidos.map((protocolo) => (
              <ProtocoloCard key={protocolo.id} protocolo={protocolo} now={now} info={resolverInfoProtocolo(protocolo)} somenteLeitura />
            ))}
            {filaFiltrada.atribuidos.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada atribuído
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
              <EmConferenciaCard key={protocolo.id} protocolo={protocolo} now={now} somenteLeitura />
            ))}
            {filaFiltrada.emConferencia.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                ninguém conferindo agora
              </div>
            )}
          </div>

          {concluidos && <ConcluidosHojeList concluidos={concluidos} now={now} somenteLeitura />}
        </div>
      </div>
    </div>
  )
}
