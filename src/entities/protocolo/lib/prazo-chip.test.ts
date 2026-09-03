import { describe, expect, it } from 'vitest'

import { prazoChip } from './prazo-chip'

const AGORA = new Date('2026-08-28T12:00:00Z').getTime()

describe('prazoChip', () => {
  it('sem semáforo ou sem vencimento, devolve tom neutro e traço', () => {
    expect(prazoChip(null, '2026-08-28T14:00:00Z', AGORA)).toEqual({ label: '—', tom: 'neutro' })
    expect(prazoChip('Verde', null, AGORA)).toEqual({ label: '—', tom: 'neutro' })
  })

  it('verde mostra só a duração pura, sem prefixo', () => {
    const vencimento = new Date(AGORA + 2 * 60 * 60 * 1000).toISOString()
    expect(prazoChip('Verde', vencimento, AGORA)).toEqual({ label: '2h', tom: 'ok' })
  })

  it('amarelo/laranja ainda não vencidos mostram "vence em"', () => {
    const vencimento = new Date(AGORA + 30 * 60_000).toISOString()
    expect(prazoChip('Amarelo', vencimento, AGORA)).toEqual({ label: 'vence em 30min', tom: 'atencao' })
    expect(prazoChip('Laranja', vencimento, AGORA)).toEqual({ label: 'vence em 30min', tom: 'critico' })
  })

  it('vermelho (ou qualquer faixa) já vencido mostra "estourou há"', () => {
    const vencimento = new Date(AGORA - 90 * 60_000).toISOString()
    expect(prazoChip('Vermelho', vencimento, AGORA)).toEqual({ label: 'estourou há 1h30', tom: 'vencido' })
  })
})
