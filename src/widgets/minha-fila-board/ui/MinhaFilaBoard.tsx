import { useEffect, useRef, useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { criarResolverInfoProtocolo, LegendaPrazo, useConcluidosHoje, useMinhaFila } from '@/entities/protocolo'
import { useTiposAto } from '@/entities/tipoAto'
import { useSessionStore } from '@/entities/usuario'
import { useConcluirConferencia } from '@/features/minha-fila/concluir-conferencia'
import { useIniciarConferencia } from '@/features/minha-fila/iniciar-conferencia'
import { usePausarConferencia } from '@/features/minha-fila/pausar-conferencia'
import { usePegarProtocolo } from '@/features/minha-fila/pegar-protocolo'
import { useRetomarConferencia } from '@/features/minha-fila/retomar-conferencia'
import { useIsMobile } from '@/shared/lib/use-is-mobile'
import { useNow } from '@/shared/lib/use-now'
import { Carregando } from '@/shared/ui/carregando'
import { BarraDeFiltros, useFiltroProtocolos } from '@/widgets/filtro-protocolos'

import { MAX_POOL_VISIVEL, MAX_POOL_VISIVEL_MOBILE } from '../lib/constantes'
import { listarAltasPendentes, localizar, type AbaDaFila } from '../lib/prioridade-alta'
import { useAvisoPrioridadeAlta } from '../model/use-aviso-prioridade-alta'
import { AvisoPrioridadeAlta } from './AvisoPrioridadeAlta'
import { ConcluidosHojeList } from './ConcluidosHojeList'
import { EmConferenciaCard } from './EmConferenciaCard'
import { FilaColunas } from './FilaColunas'
import { IndicadorAtualizacao } from './IndicadorAtualizacao'
import { ListaAltasSheet } from './ListaAltasSheet'
import { ListaCompletaPoolSheet } from './ListaCompletaPoolSheet'
import { ProtocoloCard } from './ProtocoloCard'

// RF-24j — o anel do card levado pelo "Ver" pulsa por ~4s; o aviso de filtros limpos fica 7s.
const DURACAO_DESTAQUE_MS = 4200
const DURACAO_AVISO_FILTRO_MS = 7000

// O card pode estar num Sheet (portal) que ainda está abrindo quando o "Ver" roda — uma segunda
// tentativa depois de um instante cobre isso.
const rolarAteOCard = (protocoloId: string, tentativa = 0) => {
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-protocolo-id="${CSS.escape(protocoloId)}"]`)
    if (card) {
      const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      card.scrollIntoView({ block: 'center', behavior: reduzido ? 'auto' : 'smooth' })
    } else if (tentativa === 0) {
      window.setTimeout(() => rolarAteOCard(protocoloId, 1), 200)
    }
  })
}

// Board de 3 colunas (RF-19 a RF-24) — pool disponível, atribuídas a você, em conferência (+
// concluídos hoje, aninhado na mesma coluna, igual ao protótipo aprovado).
export const MinhaFilaBoard = () => {
  const { data: fila, isLoading, dataUpdatedAt } = useMinhaFila()
  const usuarioId = useSessionStore((state) => state.usuario?.id)
  const { data: concluidos } = useConcluidosHoje()
  const { data: escreventes } = useEscreventes()
  const { data: equipes } = useEquipes()
  const { data: tiposAto } = useTiposAto()
  const now = useNow()
  const mobile = useIsMobile()
  const maxPoolVisivel = mobile ? MAX_POOL_VISIVEL_MOBILE : MAX_POOL_VISIVEL

  const pegar = usePegarProtocolo()
  const iniciar = useIniciarConferencia()
  const concluir = useConcluirConferencia()
  const pausar = usePausarConferencia()
  const retomar = useRetomarConferencia()
  const [listaCompletaAberta, setListaCompletaAberta] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<AbaDaFila>('pool')
  const [destaqueId, setDestaqueId] = useState<string | null>(null)
  const [listaAltasAberta, setListaAltasAberta] = useState(false)
  const [filtroLimpoEm, setFiltroLimpoEm] = useState<number | null>(null)
  const timerDestaque = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timerDestaque.current), [])

  // RF-19/RF-24: protótipo v2 passou a mostrar tipo de ato/escrevente/equipe no card daqui
  // também (antes só Distribuição mostrava) — mesmo padrão de "back manda o fato cru, front
  // resolve o nome" já usado lá. Extraído pra `entities/protocolo` — mesma lógica repetida em
  // DistribuicaoBoard/FilaDoConferenteBoard/PainelDetalheProtocolo.
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

  // RF-24h — sobre a fila SEM filtro: a faixa avisa mesmo quando o filtro esconde o card.
  const altas = fila ? listarAltasPendentes(fila) : []

  // RF-24j — "Ver": leva até o card, na ordem: limpa o filtro se ele esconde o card, troca a aba
  // (no celular), abre a lista completa se o card está além dos visíveis do pool, destaca e rola.
  const irPara = (protocoloId: string) => {
    setListaAltasAberta(false)
    const onde = fila && localizar(protocoloId, fila, filtroProtocolos.passaNoFiltro, maxPoolVisivel)
    if (!onde) return
    if (onde.escondidoPeloFiltro) {
      filtroProtocolos.limpar()
      setFiltroLimpoEm(Date.now())
    }
    setAbaAtiva(onde.aba)
    setListaCompletaAberta(onde.abrirListaCompleta)
    setDestaqueId(protocoloId)
    window.clearTimeout(timerDestaque.current)
    timerDestaque.current = window.setTimeout(() => setDestaqueId(null), DURACAO_DESTAQUE_MS)
    rolarAteOCard(protocoloId)
  }

  useAvisoPrioridadeAlta({
    altas,
    atualizadoEm: dataUpdatedAt,
    usuarioId,
    onVer: irPara,
    onVerTodos: () => setListaAltasAberta(true),
  })

  if (isLoading || !fila) {
    return <Carregando />
  }

  const erro = pegar.error ?? iniciar.error ?? concluir.error ?? pausar.error ?? retomar.error
  const { passaNoFiltro } = filtroProtocolos
  const filaFiltrada = {
    poolDisponivel: fila.poolDisponivel.filter(passaNoFiltro),
    atribuidos: fila.atribuidos.filter(passaNoFiltro),
    emConferencia: fila.emConferencia.filter(passaNoFiltro),
  }

  return (
    <div>
      <AvisoPrioridadeAlta altas={altas} onVer={irPara} onVerTodos={() => setListaAltasAberta(true)} />
      <ListaAltasSheet
        aberto={listaAltasAberta}
        onFechar={() => setListaAltasAberta(false)}
        altas={altas}
        now={now}
        resolverInfo={resolverInfoProtocolo}
        onVer={irPara}
        onPegar={(protocoloId) => pegar.mutate(protocoloId)}
        pegando={pegar.isPending}
      />

      {erro && <p className="mb-3 text-[13px] text-bad-fg">Não foi possível concluir a ação. Tente de novo.</p>}

      <LegendaPrazo faixas={fila?.faixas} />
      <div className="mt-3.5">
        <BarraDeFiltros {...filtroProtocolos} subtitulo="aplicados às três colunas da sua fila" />
      </div>
      {filtroLimpoEm !== null && now - filtroLimpoEm < DURACAO_AVISO_FILTRO_MS && (
        <p role="status" className="mt-2 text-[12px] text-text-3">
          Filtros limpos para mostrar o protocolo de prioridade alta.
        </p>
      )}
      <IndicadorAtualizacao atualizadoEm={dataUpdatedAt} />

      <FilaColunas
        abaAtiva={abaAtiva}
        onAbaAtivaChange={setAbaAtiva}
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
                  acaoLabel="Pegar este"
                  onAcao={() => pegar.mutate(protocolo.id)}
                  acaoDesabilitada={pegar.isPending}
                  // RF-23: só o dono edita observação — um protocolo no pool ainda não tem
                  // dono (achado real: editar aqui abria o campo e o PUT sempre voltava 403
                  // "NaoEhSeu", deixando o campo travado sem fechar — mesmo bug reportado,
                  // causa raiz). Observação existente continua visível, só não editável; a
                  // ação "Pegar este" continua ativa (diferente de `somenteLeitura`, que
                  // desliga os dois).
                  observacaoSomenteLeitura
                  destacado={protocolo.id === destaqueId}
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
                  nada no pool dentro da sua alçada
                </div>
              )}
            </div>
            <ListaCompletaPoolSheet
              aberto={listaCompletaAberta}
              onFechar={() => setListaCompletaAberta(false)}
              protocolos={filaFiltrada.poolDisponivel}
              now={now}
              resolverInfo={resolverInfoProtocolo}
              acaoLabel="Pegar este"
              onAcao={(protocoloId) => pegar.mutate(protocoloId)}
              acaoDesabilitada={pegar.isPending}
              destaqueId={destaqueId}
            />
          </>
        }
        minhasTotal={filaFiltrada.atribuidos.length}
        minhas={
          <>
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
                  info={resolverInfoProtocolo(protocolo)}
                  acaoLabel="Iniciar conferência"
                  acaoVariante="default"
                  onAcao={() => iniciar.mutate(protocolo.id)}
                  acaoDesabilitada={iniciar.isPending}
                  destacado={protocolo.id === destaqueId}
                />
              ))}
              {filaFiltrada.atribuidos.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  nada atribuído a você
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
                  onAprovar={() => concluir.mutate({ protocoloId: protocolo.id, aprovado: true })}
                  onReprovar={() => concluir.mutate({ protocoloId: protocolo.id, aprovado: false })}
                  onPausar={() => pausar.mutate(protocolo.id)}
                  onRetomar={() => retomar.mutate(protocolo.id)}
                  desabilitado={concluir.isPending || pausar.isPending || retomar.isPending}
                  destacado={protocolo.id === destaqueId}
                />
              ))}
              {filaFiltrada.emConferencia.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  nada em conferência — pegue um do pool
                </div>
              )}
            </div>

            {concluidos && <ConcluidosHojeList concluidos={concluidos} now={now} nomePorTipoAtoId={nomePorTipoAtoId} />}
          </>
        }
      />
    </div>
  )
}
