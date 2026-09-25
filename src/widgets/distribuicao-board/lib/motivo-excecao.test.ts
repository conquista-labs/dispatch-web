import { describe, expect, it } from 'vitest'

import { apresentacaoDaExcecao } from './motivo-excecao'

describe('apresentacaoDaExcecao', () => {
  it('tipo desconhecido vira "tipo novo" e pede alçada', () => {
    const a = apresentacaoDaExcecao('tipo desconhecido')
    expect(a.tag).toBe('tipo novo')
    expect(a.tipoNovo).toBe(true)
  })

  it('cada motivo do motor tem a sua tag, sem cair em "sem alçada"', () => {
    expect(apresentacaoDaExcecao('tipo desativado').tag).toBe('tipo desativado')
    expect(apresentacaoDaExcecao('conferente da primeira conferência não está mais disponível').tag).toBe(
      'continuidade',
    )
    expect(apresentacaoDaExcecao('ninguém com alçada').tag).toBe('sem alçada')
  })

  it('motivo desconhecido pelo front aparece como veio', () => {
    expect(apresentacaoDaExcecao('motivo novo do back')).toEqual({
      tag: 'exceção',
      frase: 'motivo novo do back',
      tipoNovo: false,
    })
  })
})
