import { useState } from 'react'

import { useConferentes } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { usePedidosReaberturaPendentes } from '@/entities/pedidoReabertura'
import { useVisaoDistribuicao, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { useTiposAto } from '@/entities/tipoAto'
import { cn } from '@/shared/lib/utils'
import { useNow } from '@/shared/lib/use-now'
import { BarraDeFiltros, useFiltroProtocolos } from '@/widgets/filtro-protocolos'
import { PainelDetalheProtocolo } from '@/widgets/painel-detalhe-protocolo'

import { AbaExcecoes } from './AbaExcecoes'
import { AbaPorConferente } from './AbaPorConferente'
import { AbaPorStatus } from './AbaPorStatus'

type Aba = 'conferente' | 'status' | 'excecoes'

// Texto e cor batendo com o protótipo aprovado (Dispatch.dc.html, `faixas()`/legenda): mesmos
// limiares hardcoded do back (4h/60min, ver DistribuicaoEndpoints.cs) até existir tabela de
// config — se um dia virar configurável, esse texto precisa vir junto.
const LEGENDA = [
  { label: 'no prazo', className: 'bg-ok-bg border-ok-bar' },
  { label: 'faltam menos de 4h', className: 'bg-warn-bg-2 border-warn-bar' },
  { label: 'faltam menos de 60min', className: 'bg-crit-bg-2 border-crit-bar' },
  { label: 'prazo estourado', className: 'bg-bad-bg-2 border-bad-bar' },
]

// As 3 visões do mesmo conjunto de protocolos (RF-13) — "por conferente" (empurra), "por
// status" (kanban) e "exceções" (RF-17).
export const DistribuicaoBoard = () => {
  const [aba, setAba] = useState<Aba>('conferente')
  const [protocoloDetalheId, setProtocoloDetalheId] = useState<string | null>(null)
  const { data: visao, isLoading } = useVisaoDistribuicao()
  const { data: conferentes } = useConferentes()
  const { data: pedidosReabertura } = usePedidosReaberturaPendentes()
  const { data: escreventes } = useEscreventes()
  const { data: equipes } = useEquipes()
  const { data: tiposAto } = useTiposAto()
  const now = useNow()

  // RF-14: tipo de ato/escrevente/equipe do card — back manda só os ids (EscreventeId,
  // TipoAtoId), o front resolve o nome cruzando com GET /escreventes, /equipes e /tipos-ato,
  // mesmo padrão já usado no painel de detalhe do protocolo. Um resolver só (em vez de três
  // props separadas) pra não espalhar prop de mais pelos componentes que só repassam adiante
  // (ProtocoloColuna/ExcecaoCard não usam o valor, só entregam pro card).
  const nomePorTipoAtoId = new Map((tiposAto ?? []).map((t) => [t.id, t.nome]))
  const escreventePorId = new Map((escreventes ?? []).map((e) => [e.id, e]))
  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const resolverInfoProtocolo = (protocolo: ProtocoloResumo): InfoProtocolo => {
    const escrevente = escreventePorId.get(protocolo.escreventeId)
    return {
      tipoAtoNome: protocolo.tipoAtoId ? (nomePorTipoAtoId.get(protocolo.tipoAtoId) ?? null) : null,
      escreventeNome: escrevente?.nome ?? null,
      equipeId: escrevente?.equipeId ?? null,
      equipeNome: escrevente?.equipeId ? (nomePorEquipeId.get(escrevente.equipeId) ?? null) : null,
    }
  }

  // RF-18e: os filtros afetam as três visões (abas) ao mesmo tempo — um estado só, aplicado
  // em cada lista antes de repassar pras abas. A contagem por opção usa a união de tudo (as 5
  // listas somadas, sem repetir "porConferente" que já é atribuidos+emConferencia agrupado).
  // Hook chamado incondicionalmente (regra dos hooks) — antes de qualquer `return` cedo por
  // carregamento, com listas vazias como fallback enquanto os dados não chegam.
  const todosOsProtocolos = visao
    ? [...visao.pool, ...visao.atribuidos, ...visao.emConferencia, ...visao.concluidos, ...visao.excecoes]
    : []
  const filtroProtocolos = useFiltroProtocolos({
    protocolos: todosOsProtocolos,
    resolverInfo: resolverInfoProtocolo,
    equipes: equipes ?? [],
    tiposAto: tiposAto ?? [],
    now,
  })

  if (isLoading || !visao || !conferentes || !escreventes || !equipes || !tiposAto) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const conferentesNaEscala = conferentes.filter((c) => c.naEscala)
  // RF-18b: exceções e pedidos de reabertura contam separado, no mesmo rótulo da aba.
  const qtdPedidos = pedidosReabertura?.length ?? 0
  const sufixoPedidos = qtdPedidos > 0 ? ` · ${qtdPedidos} ${qtdPedidos > 1 ? 'pedidos' : 'pedido'}` : ''

  const { passaNoFiltro } = filtroProtocolos
  const visaoFiltrada = {
    ...visao,
    pool: visao.pool.filter(passaNoFiltro),
    atribuidos: visao.atribuidos.filter(passaNoFiltro),
    emConferencia: visao.emConferencia.filter(passaNoFiltro),
    concluidos: visao.concluidos.filter(passaNoFiltro),
    excecoes: visao.excecoes.filter(passaNoFiltro),
    porConferente: visao.porConferente.map((grupo) => ({ ...grupo, protocolos: grupo.protocolos.filter(passaNoFiltro) })),
  }

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['conferente', 'Por conferente'],
            ['status', 'Por status'],
            ['excecoes', `Exceções · ${visaoFiltrada.excecoes.length}${sufixoPedidos}`],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground',
              aba === valor && 'bg-card text-foreground shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
        <span className="font-mono text-[11.5px] text-muted-foreground">Prazo do ato</span>
        {LEGENDA.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
            <span className={`block size-2.5 flex-none rounded-[3px] border ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="mt-3.5">
        <BarraDeFiltros {...filtroProtocolos} subtitulo="aplicados às três visões do quadro" />
      </div>

      <div className="mt-4">
        {aba === 'conferente' && (
          <AbaPorConferente
            pool={visaoFiltrada.pool}
            porConferente={visaoFiltrada.porConferente}
            conferentes={conferentesNaEscala}
            now={now}
            resolverInfo={resolverInfoProtocolo}
            onAbrirDetalhe={setProtocoloDetalheId}
          />
        )}
        {aba === 'status' && (
          <AbaPorStatus visao={visaoFiltrada} conferentes={conferentes} now={now} resolverInfo={resolverInfoProtocolo} onAbrirDetalhe={setProtocoloDetalheId} />
        )}
        {aba === 'excecoes' && (
          <AbaExcecoes
            excecoes={visaoFiltrada.excecoes}
            conferentes={conferentesNaEscala}
            resolverInfo={resolverInfoProtocolo}
            onAbrirDetalhe={setProtocoloDetalheId}
          />
        )}
      </div>

      <PainelDetalheProtocolo protocoloId={protocoloDetalheId} onFechar={() => setProtocoloDetalheId(null)} />
    </div>
  )
}
