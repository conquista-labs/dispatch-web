import { describe, expect, it } from 'vitest'

import type { MinhaFila, ProtocoloResumo } from '@/entities/protocolo'

import { listarAltasPendentes, localizar } from './prioridade-alta'
import { protocoloDeTeste } from './test/protocolo-de-teste'

const p = protocoloDeTeste

const alta = (id: string, vencimentoEm: string) => p(id, { prioridade: 'Alta', vencimentoEm })

describe('listarAltasPendentes (RF-24h)', () => {
  it('traz os do conferente primeiro (atribuídas e em conferência por vencimento), depois o pool', () => {
    const fila: MinhaFila = {
      poolDisponivel: [
        alta('pool-tarde', '2026-09-26T18:00:00Z'),
        p('comum'),
        alta('pool-cedo', '2026-09-26T08:00:00Z'),
      ],
      atribuidos: [alta('minha', '2026-09-26T15:00:00Z')],
      emConferencia: [alta('conf', '2026-09-26T09:00:00Z')],
    }

    expect(listarAltasPendentes(fila).map((a) => [a.protocolo.id, a.onde])).toEqual([
      ['conf', 'conf'],
      ['minha', 'minhas'],
      ['pool-cedo', 'pool'],
      ['pool-tarde', 'pool'],
    ])
  })

  it('sem nenhum de prioridade alta, lista vazia', () => {
    expect(listarAltasPendentes({ poolDisponivel: [p('a')], atribuidos: [p('b')], emConferencia: [] })).toEqual([])
  })
})

describe('localizar (RF-24j)', () => {
  const pool = Array.from({ length: 7 }, (_, i) => p(`pool-${i}`))
  const fila: MinhaFila = { poolDisponivel: pool, atribuidos: [p('minha')], emConferencia: [p('conf')] }
  const semFiltro = () => true

  it('card entre os visíveis do pool: só a aba, sem lista completa', () => {
    expect(localizar('pool-2', fila, semFiltro, 5)).toEqual({
      aba: 'pool',
      abrirListaCompleta: false,
      escondidoPeloFiltro: false,
    })
  })

  it('card além dos visíveis do pool: abre a lista completa', () => {
    expect(localizar('pool-6', fila, semFiltro, 5)?.abrirListaCompleta).toBe(true)
  })

  it('no celular (8 visíveis) o mesmo card cabe sem lista completa', () => {
    expect(localizar('pool-6', fila, semFiltro, 8)?.abrirListaCompleta).toBe(false)
  })

  it('filtro escondendo o card: marca pra limpar e conta a posição na lista inteira', () => {
    const soOsDoInicio = (x: ProtocoloResumo) => ['pool-0', 'pool-1'].includes(x.id)
    expect(localizar('pool-6', fila, soOsDoInicio, 5)).toEqual({
      aba: 'pool',
      abrirListaCompleta: true,
      escondidoPeloFiltro: true,
    })
  })

  it('filtro que esconde outros encurta a lista visível', () => {
    const escondeOsPrimeiros = (x: ProtocoloResumo) => !['pool-0', 'pool-1', 'pool-2'].includes(x.id)
    expect(localizar('pool-6', fila, escondeOsPrimeiros, 5)?.abrirListaCompleta).toBe(false)
  })

  it('atribuída e em conferência caem nas abas certas', () => {
    expect(localizar('minha', fila, semFiltro, 5)?.aba).toBe('minhas')
    expect(localizar('conf', fila, semFiltro, 5)?.aba).toBe('conferencia')
  })

  it('protocolo que saiu da fila: null', () => {
    expect(localizar('sumiu', fila, semFiltro, 5)).toBeNull()
  })
})
