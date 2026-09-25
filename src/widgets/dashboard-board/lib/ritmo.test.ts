import { describe, expect, it } from 'vitest'

import {
  classeDoRitmo,
  explicacaoDoRitmo,
  formatarRitmo,
  linhasDoTempoPorTipo,
  textoDoRitmo,
  variacaoDoRitmo,
} from './ritmo'

describe('ritmo', () => {
  it('formato, cor e texto do protótipo', () => {
    expect(formatarRitmo(0.756)).toBe('0,76×')
    expect([classeDoRitmo(0.95), classeDoRitmo(1.05), classeDoRitmo(1.2)]).toEqual([
      'text-ok-fg',
      'text-text-3',
      'text-crit-fg',
    ])
    expect(textoDoRitmo(0.76)).toBe('24% mais rápido que a referência do tipo de ato')
    expect(textoDoRitmo(1.12)).toBe('12% mais lento que a referência do tipo de ato')
  })

  it('variação em valor absoluto: cair é bom', () => {
    expect(variacaoDoRitmo(0.76, 0.82)).toEqual({ texto: '↓ 0,06', tom: 'bom' })
    expect(variacaoDoRitmo(0.9, 0.8)).toEqual({ texto: '↑ 0,10', tom: 'ruim' })
    expect(variacaoDoRitmo(0.9, null)).toBeNull()
  })

  it('tempo por tipo: diferença, cor e barras', () => {
    const [inventario, venda] = linhasDoTempoPorTipo([
      { tipoAtoId: 'i', nome: 'Inventário', atos: 3, meuTempoMedio: '00:24:00', referenciaMinutos: 30 },
      { tipoAtoId: 'v', nome: 'Venda e Compra', atos: 10, meuTempoMedio: '00:20:00', referenciaMinutos: 18 },
    ])
    expect(inventario).toMatchObject({ diferenca: '−20%', classe: 'text-ok-fg' })
    expect(venda).toMatchObject({ diferenca: '+11%', classe: 'text-crit-fg' })
    expect(inventario.referenciaPct).toBeCloseTo((30 / (30 * 1.15)) * 100)
  })

  it('frase explicativa', () => {
    expect(explicacaoDoRitmo('00:16:00', '00:21:00', 0.76)).toMatch(
      /^Seu tempo bruto é 16 min, e a referência para o mesmo conjunto de atos seria 21 min — por isso seu ritmo é 0,76×\./,
    )
    expect(explicacaoDoRitmo(null, '00:21:00', 0.76)).toBeNull()
  })
})
