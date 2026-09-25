import type { MinhaFila, ProtocoloResumo } from '@/entities/protocolo'

// RF-24h — onde está cada protocolo de prioridade alta que o conferente precisa ver: atribuído a
// ele, em conferência com ele, ou no pool dentro da alçada dele (o back já filtra o pool).
export type OndeAlta = 'minhas' | 'conf' | 'pool'

export type AltaPendente = { protocolo: ProtocoloResumo; onde: OndeAlta }

export type AbaDaFila = 'pool' | 'minhas' | 'conferencia'

const porVencimento = (a: ProtocoloResumo, b: ProtocoloResumo) =>
  (a.vencimentoEm ? Date.parse(a.vencimentoEm) : Infinity) - (b.vencimentoEm ? Date.parse(b.vencimentoEm) : Infinity)

const ehAlta = (p: ProtocoloResumo) => p.prioridade === 'Alta'

// Os do conferente primeiro (atribuídas e em conferência juntas, por vencimento), depois os do
// pool (por vencimento) — a ordem do protótipo e do RF-24h. Sempre sobre a fila SEM filtro: a
// faixa avisa mesmo quando o filtro esconde o card.
export function listarAltasPendentes(fila: MinhaFila): AltaPendente[] {
  const seus: AltaPendente[] = [
    ...fila.atribuidos.filter(ehAlta).map((protocolo) => ({ protocolo, onde: 'minhas' as const })),
    ...fila.emConferencia.filter(ehAlta).map((protocolo) => ({ protocolo, onde: 'conf' as const })),
  ].sort((a, b) => porVencimento(a.protocolo, b.protocolo))
  const pool = fila.poolDisponivel
    .filter(ehAlta)
    .sort(porVencimento)
    .map((protocolo) => ({ protocolo, onde: 'pool' as const }))
  return [...seus, ...pool]
}

export type Localizacao = {
  aba: AbaDaFila
  // O card está além dos visíveis do pool — só a lista completa (Sheet) mostra.
  abrirListaCompleta: boolean
  // O filtro atual esconde o card — o "Ver" precisa limpar o filtro antes (RF-24j).
  escondidoPeloFiltro: boolean
}

// RF-24j — o que o "Ver" tem de fazer pra o card ficar visível. Se o filtro esconde o card, ele
// vai ser limpo; então a posição no pool é contada na lista inteira, não na filtrada.
export function localizar(
  protocoloId: string,
  fila: MinhaFila,
  passaNoFiltro: (p: ProtocoloResumo) => boolean,
  maxPoolVisivel: number,
): Localizacao | null {
  const colunas: [AbaDaFila, ProtocoloResumo[]][] = [
    ['pool', fila.poolDisponivel],
    ['minhas', fila.atribuidos],
    ['conferencia', fila.emConferencia],
  ]
  for (const [aba, protocolos] of colunas) {
    const protocolo = protocolos.find((p) => p.id === protocoloId)
    if (!protocolo) continue

    const escondidoPeloFiltro = !passaNoFiltro(protocolo)
    const visiveis = escondidoPeloFiltro ? protocolos : protocolos.filter(passaNoFiltro)
    const abrirListaCompleta = aba === 'pool' && visiveis.findIndex((p) => p.id === protocoloId) >= maxPoolVisivel
    return { aba, abrirListaCompleta, escondidoPeloFiltro }
  }
  return null
}
