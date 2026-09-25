import { describe, expect, it } from 'vitest'

import type { PainelDeHoje } from '@/entities/dashboard'

import { itensDoPainel, textoDoGargalo } from './painel-de-hoje'

const gestao = (sobrescreve: Partial<PainelDeHoje> = {}): PainelDeHoje => ({
  visao: 'Gestao',
  atualizadoEm: '2026-09-25T15:44:00Z',
  conferidosHoje: 36,
  naFila: { pool: 6, comConferente: 11 },
  naMao: null,
  emRisco: { estourados: 2, vencemEmUmaHora: 1 },
  excecoes: 0,
  gargalo: null,
  ...sobrescreve,
})

describe('itensDoPainel', () => {
  it('gestão: quatro células com os textos do protótipo e o destino de cada uma', () => {
    const itens = itensDoPainel(gestao())
    expect(itens.map((i) => [i.label, i.valor, i.sub])).toEqual([
      ['Conferidos hoje', '36', 'aprovados e não aprovados'],
      ['Na fila', '17', '6 no pool · 11 com conferente'],
      ['Em risco', '3', '2 estourados · 1 vencem em 1h'],
      ['Exceções', '0', 'nada parado'],
    ])
    expect(itens[3].destino).toBe('/distribuicao?aba=excecoes')
  })

  it('cor do risco: vermelho com estourado, laranja só com os de 1h, neutro sem nada', () => {
    expect(itensDoPainel(gestao())[2].tom).toBe('bad')
    expect(itensDoPainel(gestao({ emRisco: { estourados: 0, vencemEmUmaHora: 2 } }))[2].tom).toBe('crit')
    expect(itensDoPainel(gestao({ emRisco: { estourados: 0, vencemEmUmaHora: 0 } }))[2].tom).toBeNull()
    expect(itensDoPainel(gestao({ excecoes: 2 }))[3]).toMatchObject({ tom: 'warn', sub: 'esperando decisão manual' })
  })

  it('conferente: três células, sem destino por célula', () => {
    const itens = itensDoPainel(
      gestao({
        visao: 'Conferente',
        naFila: null,
        excecoes: null,
        naMao: { total: 3, emConferencia: 1 },
        conferidosHoje: 0,
      }),
    )
    expect(itens.map((i) => [i.label, i.valor, i.sub])).toEqual([
      ['Conferidos hoje', '0', 'nenhum ainda'],
      ['Na sua mão', '3', '1 em conferência agora'],
      ['Em risco com você', '3', '2 estourados · 1 vencem em 1h'],
    ])
    expect(itens.every((i) => !i.destino)).toBe(true)
  })
})

describe('textoDoGargalo', () => {
  it('nomeia a equipe, ou "sem equipe" quando o back manda equipe nula', () => {
    expect(textoDoGargalo(gestao({ gargalo: { equipeId: 'e1', quantidade: 5 } }), () => 'Quinto Andar')).toBe(
      'Quinto Andar concentra 5 dos protocolos estourados ou vencendo em 1h.',
    )
    expect(textoDoGargalo(gestao({ gargalo: { equipeId: null, quantidade: 3 } }), () => undefined)).toBe(
      'Escreventes sem equipe concentram 3 dos protocolos estourados ou vencendo em 1h.',
    )
    expect(textoDoGargalo(gestao(), () => 'x')).toBeNull()
  })
})
