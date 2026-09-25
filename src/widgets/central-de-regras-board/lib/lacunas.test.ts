import { describe, expect, it } from 'vitest'

import type { AlcanceDoConferente, Conferente } from '@/entities/conferente'
import type { TipoAto } from '@/entities/tipoAto'

import { lacunasDaMatriz } from './lacunas'

const tipo = (id: string, ativo = true) => ({ id, nome: `Tipo ${id}`, ativo }) as TipoAto
const conferente = (id: string) => ({ id, nome: `Conf ${id}` }) as Conferente
const alcance = (conferenteId: string, tipos: string[]) =>
  ({ conferenteId, tiposPermitidosIds: tipos, etapasPermitidas: [], equipesPermitidasIds: [] }) as AlcanceDoConferente

describe('lacunasDaMatriz', () => {
  const conferentes = [conferente('a'), conferente('b')]

  it('lista os tipos sem ninguém e conta os que dependem de uma pessoa', () => {
    const tipos = [tipo('1'), tipo('2'), tipo('3')]
    expect(lacunasDaMatriz(tipos, conferentes, [alcance('a', ['1', '2']), alcance('b', ['1'])])).toBe(
      '1 tipo sem ninguém: Tipo 3. 1 com uma só pessoa.',
    )
  })

  it('corta a lista em 4 nomes e ignora tipo desativado', () => {
    const tipos = ['1', '2', '3', '4', '5'].map((id) => tipo(id)).concat(tipo('x', false))
    expect(lacunasDaMatriz(tipos, conferentes, [])).toBe('5 tipos sem ninguém: Tipo 1, Tipo 2, Tipo 3, Tipo 4….')
  })

  it('sem lacuna, não avisa', () => {
    expect(lacunasDaMatriz([tipo('1')], conferentes, [alcance('a', ['1']), alcance('b', ['1'])])).toBeNull()
  })
})
