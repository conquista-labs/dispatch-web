import { describe, expect, it } from 'vitest'

import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'

import { contagemDoPrazoEmVigor, itensDePrazoEmVigor } from './prazo-em-vigor'

const equipe = (id: string, pre: Equipe['prazoPreConferencia'] = 'D1', pos: Equipe['prazoPosConferencia'] = 'D1') =>
  ({
    id,
    nome: `Equipe ${id}`,
    prazoPreConferencia: pre,
    prazoPosConferencia: pos,
    cortePreConferenciaHorarioCorte: null,
    cortePreConferenciaHorarioVencimento: null,
    cortePosConferenciaHorarioCorte: null,
    cortePosConferenciaHorarioVencimento: null,
  }) as Equipe

const escrevente = (id: string, equipeId: string | null) => ({ id, nome: `Escrevente ${id}`, equipeId }) as Escrevente

describe('itensDePrazoEmVigor', () => {
  it('o prazo mais comum vira uma linha com os nomes; as equipes fora do padrão aparecem uma a uma', () => {
    const equipes = ['a', 'b', 'c', 'd', 'e'].map((id) => equipe(id)).concat(equipe('x', 'D0', 'UmaHora'))
    const itens = itensDePrazoEmVigor(equipes, [escrevente('1', 'x'), escrevente('2', null)])

    expect(itens[0].frase).toMatch(/^5 equipes no prazo padrão: pré-conferência em /)
    expect(itens[0].detalhe).toBe('Equipe a, Equipe b, Equipe c, Equipe d e mais 1')
    expect(itens[1].frase).toMatch(/^Escreventes de Equipe x:/)
    expect(itens[1].detalhe).toBe('1 escrevente · Escrevente 1')
    expect(itens[2].frase).toBe('Escrevente sem equipe: prazo padrão D+1')
    expect(contagemDoPrazoEmVigor(equipes, [escrevente('2', null)])).toBe('6 equipes · 1 sem equipe')
  })

  it('sem prazo repetido, não agrupa', () => {
    const itens = itensDePrazoEmVigor([equipe('a', 'D0'), equipe('b', 'D1')], [])
    expect(itens).toHaveLength(2)
    expect(itens.every((i) => i.frase.startsWith('Escreventes de'))).toBe(true)
  })
})
