import { useState } from 'react'

import {
  contagemFiltrosAtivos,
  filtroVazio,
  protocoloPassaNoFiltro,
  type FaixaSemaforo,
  type FiltroProtocolo,
  type InfoProtocolo,
  type Prioridade,
  type ProtocoloResumo,
} from '@/entities/protocolo'

export type OpcaoContagem<T> = { valor: T; label: string; contagem: number }

type UseFiltroProtocolosArgs = {
  /** União de TODOS os protocolos da tela (todas as colunas/abas juntas) — só usada pra
   * calcular a contagem de cada opção contra o conjunto completo, não pra filtrar aqui. */
  protocolos: ProtocoloResumo[]
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  equipes: { id: string; nome: string }[]
  tiposAto: { id: string; nome: string }[]
}

const FAIXAS: FaixaSemaforo[] = ['Verde', 'Amarelo', 'Laranja', 'Vermelho']
const FAIXA_LABEL: Record<FaixaSemaforo, string> = { Verde: 'no prazo', Amarelo: 'atenção', Laranja: 'crítico', Vermelho: 'vencido' }

// RF-18e/RF-24f: filtro 100% client-side ("os filtros... não alteram dado nenhum — só o
// recorte exibido") — recebe a lista que a tela já buscou inteira, nenhuma chamada nova.
// Reaproveitado por Distribuição e Minha fila (as duas telas que o requisito pede).
export const useFiltroProtocolos = ({ protocolos, resolverInfo, equipes, tiposAto }: UseFiltroProtocolosArgs) => {
  const [filtro, setFiltro] = useState<FiltroProtocolo>(filtroVazio())

  const infoPorProtocoloId = new Map(protocolos.map((p) => [p.id, resolverInfo(p)]))
  // Predicado, não uma lista já filtrada — a tela tem várias colunas/abas com o mesmo
  // conjunto de protocolos dividido de jeitos diferentes; quem filtra cada uma é o board,
  // aplicando isso com `.filter(passaNoFiltro)` em cada lista própria dele.
  const passaNoFiltro = (protocolo: ProtocoloResumo) => {
    const info = infoPorProtocoloId.get(protocolo.id) ?? resolverInfo(protocolo)
    return protocoloPassaNoFiltro(protocolo, info, filtro)
  }

  // Contagem sempre contra o conjunto completo não filtrado — "a gestão sabe o tamanho do
  // recorte antes de aplicar" (RF-18e), não o efeito combinado com os outros eixos já ativos.
  const contarEquipe = (id: string | null) => protocolos.filter((p) => infoPorProtocoloId.get(p.id)!.equipeId === id).length
  const contarTipoAto = (id: string) => protocolos.filter((p) => p.tipoAtoId === id).length
  const contarPrioridade = (prioridade: Prioridade) => protocolos.filter((p) => p.prioridade === prioridade).length
  const contarFaixa = (faixa: FaixaSemaforo) => protocolos.filter((p) => p.semaforo === faixa).length

  const contagens = {
    equipes: [
      ...equipes.map((e): OpcaoContagem<string | null> => ({ valor: e.id, label: e.nome, contagem: contarEquipe(e.id) })),
      { valor: null, label: 'sem equipe', contagem: contarEquipe(null) },
    ],
    tiposAto: tiposAto.map((t): OpcaoContagem<string> => ({ valor: t.id, label: t.nome, contagem: contarTipoAto(t.id) })),
    prioridades: [
      { valor: 'Alta' as const, label: 'alta', contagem: contarPrioridade('Alta') },
      { valor: 'Normal' as const, label: 'normal', contagem: contarPrioridade('Normal') },
    ],
    faixasSemaforo: FAIXAS.map((f): OpcaoContagem<FaixaSemaforo> => ({ valor: f, label: FAIXA_LABEL[f], contagem: contarFaixa(f) })),
  }

  const alternarEquipe = (id: string | null) =>
    setFiltro((atual) => ({ ...atual, equipeIds: atual.equipeIds.includes(id) ? atual.equipeIds.filter((v) => v !== id) : [...atual.equipeIds, id] }))

  const alternarTipoAto = (id: string) =>
    setFiltro((atual) => ({ ...atual, tipoAtoIds: atual.tipoAtoIds.includes(id) ? atual.tipoAtoIds.filter((v) => v !== id) : [...atual.tipoAtoIds, id] }))

  const alternarPrioridade = (prioridade: Prioridade) =>
    setFiltro((atual) => ({
      ...atual,
      prioridades: atual.prioridades.includes(prioridade) ? atual.prioridades.filter((v) => v !== prioridade) : [...atual.prioridades, prioridade],
    }))

  const alternarFaixaSemaforo = (faixa: FaixaSemaforo) =>
    setFiltro((atual) => ({
      ...atual,
      faixasSemaforo: atual.faixasSemaforo.includes(faixa) ? atual.faixasSemaforo.filter((v) => v !== faixa) : [...atual.faixasSemaforo, faixa],
    }))

  return {
    filtro,
    passaNoFiltro,
    contagens,
    contagemFiltrosAtivos: contagemFiltrosAtivos(filtro),
    alternarEquipe,
    alternarTipoAto,
    alternarPrioridade,
    alternarFaixaSemaforo,
    limpar: () => setFiltro(filtroVazio()),
  }
}
