import { describe, expect, it } from 'vitest'

import { formatarFaixa, rotulosDaLegenda } from './legenda-prazo'

describe('formatarFaixa', () => {
  it('usa horas só quando é hora cheia', () => {
    expect(formatarFaixa(240)).toBe('4h')
    expect(formatarFaixa(60)).toBe('1h')
    expect(formatarFaixa(90)).toBe('90min')
    expect(formatarFaixa(45)).toBe('45min')
  })
})

describe('rotulosDaLegenda', () => {
  it('escreve os limites da configuração', () => {
    expect(rotulosDaLegenda({ atencaoMinutos: 240, urgenteMinutos: 60 })).toEqual([
      'no prazo',
      'faltam menos de 4h',
      'faltam menos de 1h',
      'prazo estourado',
    ])
  })

  it('sem faixas não inventa número', () => {
    expect(rotulosDaLegenda(undefined)).toEqual(['no prazo', 'atenção', 'crítico', 'prazo estourado'])
  })
})
