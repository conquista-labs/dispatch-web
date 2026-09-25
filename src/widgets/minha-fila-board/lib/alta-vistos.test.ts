import { afterEach, describe, expect, it } from 'vitest'

import { diffAltas, gravarAltasVistos, lerAltasVistos } from './alta-vistos'

describe('diffAltas (RF-24i)', () => {
  it('primeira carga da sessão só registra, sem novos', () => {
    expect(diffAltas(null, ['a', 'b'])).toEqual({ novos: [], vistos: ['a', 'b'] })
  })

  it('id que ainda não estava no conjunto é novo', () => {
    expect(diffAltas(['a'], ['a', 'b'])).toEqual({ novos: ['b'], vistos: ['a', 'b'] })
  })

  it('id que saiu e voltou não é novo de novo', () => {
    const depoisDeSair = diffAltas(['a', 'b'], ['a'])
    expect(depoisDeSair.novos).toEqual([])
    expect(diffAltas(depoisDeSair.vistos, ['a', 'b']).novos).toEqual([])
  })

  it('primeira carga sem nenhum alto grava lista vazia — o próximo a aparecer é novo', () => {
    const inicio = diffAltas(null, [])
    expect(diffAltas(inicio.vistos, ['c']).novos).toEqual(['c'])
  })
})

describe('memória no sessionStorage', () => {
  afterEach(() => sessionStorage.clear())

  it('nada gravado ainda: null (é a primeira carga)', () => {
    expect(lerAltasVistos('u1')).toBeNull()
  })

  it('grava e lê por usuário, sem misturar', () => {
    gravarAltasVistos('u1', ['a'])
    expect(lerAltasVistos('u1')).toEqual(['a'])
    expect(lerAltasVistos('u2')).toBeNull()
  })

  it('valor corrompido conta como nada gravado', () => {
    sessionStorage.setItem('dispatch-alta-vistos:u1', '{"nao":"lista"}')
    expect(lerAltasVistos('u1')).toBeNull()
  })
})
