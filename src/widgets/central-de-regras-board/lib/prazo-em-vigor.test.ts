import { describe, expect, it } from 'vitest'

import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'

import { contagemDoPrazoEmVigor, itensDePrazoEmVigor, rotuloDaEquipe, separarPorPrazoPadrao } from './prazo-em-vigor'

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

    expect(itens[0].frase).toBe('5 equipes no prazo padrão: pré e pós-conferência em D+1')
    expect(itens[0].detalhe).toBe('Equipe a, Equipe b, Equipe c, Equipe d e mais 1')
    expect(itens[1].frase).toMatch(/^Equipe x:/)
    expect(itens[1].detalhe).toBe('1 escrevente · Escrevente 1')
    expect(itens[2].frase).toBe('Escrevente sem equipe: prazo padrão D+1')
    expect(contagemDoPrazoEmVigor(equipes, [escrevente('2', null)])).toBe('6 equipes · 1 sem equipe')
  })

  it('sem prazo repetido, não agrupa', () => {
    const itens = itensDePrazoEmVigor([equipe('a', 'D0'), equipe('b', 'D1')], [])
    expect(itens).toHaveLength(2)
    expect(itens.every((i) => i.frase.startsWith('Equipe '))).toBe(true)
  })
})

describe('rotuloDaEquipe', () => {
  it('prefixa "Equipe" só quando o nome ainda não começa com a palavra', () => {
    expect(rotuloDaEquipe('Quinto Andar')).toBe('Equipe Quinto Andar')
    expect(rotuloDaEquipe('Equipe RIO')).toBe('Equipe RIO')
    expect(rotuloDaEquipe('equipes externas')).toBe('Equipe equipes externas')
  })
})

describe('separarPorPrazoPadrao', () => {
  it('as do prazo mais comum de um lado, as com prazo próprio do outro', () => {
    const { padrao, proprias } = separarPorPrazoPadrao([equipe('a'), equipe('b'), equipe('x', 'D0')])
    expect(padrao.map((e) => e.id)).toEqual(['a', 'b'])
    expect(proprias.map((e) => e.id)).toEqual(['x'])
  })

  it('sem prazo repetido, nenhuma é "padrão"', () => {
    expect(separarPorPrazoPadrao([equipe('a', 'D0'), equipe('b')]).padrao).toEqual([])
  })
})
