import { describe, expect, it } from 'vitest'

import { abreviacoesDeColuna } from './abreviacao'

describe('abreviacoesDeColuna', () => {
  it('usa as 4 letras do primeiro nome quando não colide (como o protótipo)', () => {
    expect(abreviacoesDeColuna(['Márcio Gomes', 'Suellen Dias'])).toEqual(['Márc', 'Suel'])
  })

  it('cai nas iniciais quando o primeiro nome colide, mantendo números inteiros', () => {
    expect(abreviacoesDeColuna(['Conferente Teste 1', 'Conferente Teste 12', 'Distribuidora Teste'])).toEqual([
      'CT1',
      'CT12',
      'Dist',
    ])
  })
})
