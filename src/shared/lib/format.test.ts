import { describe, expect, it } from 'vitest'

import { formatCronometro, formatDataHora, formatDuracaoConcluida, formatDuracaoCurta } from './format'

describe('formatDuracaoCurta', () => {
  it('fica em minutos abaixo de 1h', () => {
    expect(formatDuracaoCurta(0)).toBe('0min')
    expect(formatDuracaoCurta(30 * 60_000)).toBe('30min')
    expect(formatDuracaoCurta(59 * 60_000)).toBe('59min')
  })

  it('vira horas sem minutos quando exato', () => {
    expect(formatDuracaoCurta(60 * 60_000)).toBe('1h')
  })

  it('vira horas com minutos quando não exato', () => {
    expect(formatDuracaoCurta(80 * 60_000)).toBe('1h20')
    expect(formatDuracaoCurta((23 * 60 + 59) * 60_000)).toBe('23h59')
  })

  it('vira dias sem horas quando exato', () => {
    expect(formatDuracaoCurta(24 * 60 * 60_000)).toBe('1d')
  })

  it('vira dias com horas quando não exato', () => {
    expect(formatDuracaoCurta(28 * 60 * 60_000)).toBe('1d4h')
  })
})

describe('formatCronometro', () => {
  it('formata hh:mm:ss com zero à esquerda', () => {
    expect(formatCronometro(0)).toBe('00:00:00')
    expect(formatCronometro(82_000)).toBe('00:01:22')
    expect(formatCronometro(3_661_000)).toBe('01:01:01')
  })

  it('nunca fica negativo', () => {
    expect(formatCronometro(-5000)).toBe('00:00:00')
  })
})

describe('formatDataHora', () => {
  it('devolve data e hora no formato dd/mm/aaaa hh:mm', () => {
    // Não fixa timezone (o teste roda em qualquer máquina) — só confirma o formato, não o
    // valor exato, já que toLocaleString depende do fuso local de quem roda.
    expect(formatDataHora('2026-08-28T16:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/)
  })
})

describe('formatDuracaoConcluida', () => {
  it('converte hh:mm:ss (TimeSpan sem dias) para minutos totais', () => {
    expect(formatDuracaoConcluida('00:21:00')).toBe('21 min')
  })

  it('converte TimeSpan com dias (d.hh:mm:ss) somando tudo em minutos', () => {
    expect(formatDuracaoConcluida('1.02:30:00')).toBe('1590 min')
  })

  it('ignora segundos — só conta minutos inteiros', () => {
    expect(formatDuracaoConcluida('00:00:45')).toBe('0 min')
  })
})
