import { useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import {
  criarResolverInfoProtocolo,
  LegendaPrazo,
  useConcluidosHojeDoConferente,
  useFilaDoConferente,
} from '@/entities/protocolo'
import { useTiposAto } from '@/entities/tipoAto'
import { useIsMobile } from '@/shared/lib/use-is-mobile'
import { useNow } from '@/shared/lib/use-now'
import { Carregando } from '@/shared/ui/carregando'
import { BarraDeFiltros, useFiltroProtocolos } from '@/widgets/filtro-protocolos'
import {
  ConcluidosHojeList,
  EmConferenciaCard,
  FilaColunas,
  ListaCompletaPoolSheet,
  MAX_POOL_VISIVEL,
  MAX_POOL_VISIVEL_MOBILE,
  ProtocoloCard,
} from '@/widgets/minha-fila-board'

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
  const mobile = useIsMobile()
  const maxPoolVisivel = mobile ? MAX_POOL_VISIVEL_MOBILE : MAX_POOL_VISIVEL
  const [listaCompletaAberta, setListaCompletaAberta] = useState(false)

  // RF-24f: mesmo filtro de Minha fila — a Distribuidora acompanhando a fila de alguém também
  // se beneficia de filtrar por equipe/tipo/prioridade/prazo. Extraído pra `entities/protocolo`
  // — mesma lógica repetida em DistribuicaoBoard/MinhaFilaBoard/PainelDetalheProtocolo.
  const { resolverInfo: resolverInfoProtocolo, nomePorTipoAtoId } = criarResolverInfoProtocolo(
    escreventes,
    equipes,
    tiposAto,
  )
  const todosOsProtocolos = fila ? [...fila.poolDisponivel, ...fila.atribuidos, ...fila.emConferencia] : []
  const filtroProtocolos = useFiltroProtocolos({
    protocolos: todosOsProtocolos,
    resolverInfo: resolverInfoProtocolo,
    equipes: equipes ?? [],
    tiposAto: tiposAto ?? [],
    now,
  })

  if (isLoading || !fila) {
    return <Carregando />
  }

  const { passaNoFiltro } = filtroProtocolos
  const filaFiltrada = {
    poolDisponivel: fila.poolDisponivel.filter(passaNoFiltro),
    atribuidos: fila.atribuidos.filter(passaNoFiltro),
    emConferencia: fila.emConferencia.filter(passaNoFiltro),
  }

  return (
    <div>
      <LegendaPrazo faixas={fila?.faixas} />
      <div className="mt-3.5">
        <BarraDeFiltros {...filtroProtocolos} subtitulo="aplicados às três colunas da fila dele" />
      </div>

      <FilaColunas
        poolTotal={filaFiltrada.poolDisponivel.length}
        pool={
          <>
            <div className="flex justify-between px-0.5 pb-0.5">
              <strong className="text-[13.5px] font-semibold">Pool disponível</strong>
              <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.poolDisponivel.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {filaFiltrada.poolDisponivel.slice(0, maxPoolVisivel).map((protocolo) => (
                <ProtocoloCard
                  key={protocolo.id}
                  protocolo={protocolo}
                  now={now}
                  info={resolverInfoProtocolo(protocolo)}
                  somenteLeitura
                />
              ))}
              {filaFiltrada.poolDisponivel.length > maxPoolVisivel && (
                <button
                  type="button"
                  onClick={() => setListaCompletaAberta(true)}
                  className="rounded-[10px] border border-dashed border-border p-2 text-center text-xs text-muted-foreground hover:border-muted-foreground/40 hover:text-text-2"
                >
                  + {filaFiltrada.poolDisponivel.length - maxPoolVisivel} protocolos
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
          </>
        }
        minhasTotal={filaFiltrada.atribuidos.length}
        minhas={
          <>
            <div className="flex justify-between px-0.5 pb-0.5">
              <strong className="text-[13.5px] font-semibold">Atribuídas</strong>
              <span className="font-mono text-[11px] text-muted-foreground">{filaFiltrada.atribuidos.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {filaFiltrada.atribuidos.map((protocolo) => (
                <ProtocoloCard
                  key={protocolo.id}
                  protocolo={protocolo}
                  now={now}
                  info={resolverInfoProtocolo(protocolo)}
                  somenteLeitura
                />
              ))}
              {filaFiltrada.atribuidos.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  nada atribuído
                </div>
              )}
            </div>
          </>
        }
        conferenciaTotal={filaFiltrada.emConferencia.length}
        conferencia={
          <>
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
                  info={resolverInfoProtocolo(protocolo)}
                  somenteLeitura
                />
              ))}
              {filaFiltrada.emConferencia.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  ninguém conferindo agora
                </div>
              )}
            </div>

            {concluidos && (
              <ConcluidosHojeList
                concluidos={concluidos}
                now={now}
                nomePorTipoAtoId={nomePorTipoAtoId}
                somenteLeitura
              />
            )}
          </>
        }
      />
    </div>
  )
}
