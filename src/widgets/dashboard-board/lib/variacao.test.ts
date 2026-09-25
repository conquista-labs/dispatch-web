import { describe, expect, it } from 'vitest'

import {
  aprovadoNaPrimeira,
  legendaDoScore,
  PESOS_PADRAO,
  rotulosDaSerie,
  textoDaMeta,
  variacaoDeTempo,
  variacaoDeVolume,
  variacaoEmPontos,
} from './variacao'

describe('variação contra o período anterior', () => {
  it('volume em %, sem base quando o anterior é zero', () => {
    expect(variacaoDeVolume(104, 100)).toEqual({ texto: '↑ 4%', tom: 'bom' })
    expect(variacaoDeVolume(90, 100)).toEqual({ texto: '↓ 10%', tom: 'ruim' })
    expect(variacaoDeVolume(5, 0)).toBeNull()
  })

  it('percentuais em pontos com uma casa', () => {
    expect(variacaoEmPontos(0.9, 0.879)).toEqual({ texto: '↑ 2,1 pts', tom: 'bom' })
    expect(variacaoEmPontos(0.8, 0.8)).toEqual({ texto: '= 0,0 pts', tom: 'neutro' })
    expect(variacaoEmPontos(null, 0.8)).toBeNull()
  })

  it('tempo: cair é bom', () => {
    expect(variacaoDeTempo('00:18:00', '00:20:00')).toEqual({ texto: '↓ 2 min', tom: 'bom' })
    expect(variacaoDeTempo('00:22:00', '00:20:00')).toEqual({ texto: '↑ 2 min', tom: 'ruim' })
    expect(variacaoDeTempo(null, '00:20:00')).toBeNull()
  })

  it('aprovado na 1ª cai no percentual antigo quando a API não manda o campo', () => {
    expect(aprovadoNaPrimeira({ percentualAprovado: 0.8 })).toBe(0.8)
    expect(aprovadoNaPrimeira({ percentualAprovado: 0.8, percentualAprovadoNaPrimeira: 0.7 })).toBe(0.7)
    expect(aprovadoNaPrimeira({ percentualAprovado: 0.8, percentualAprovadoNaPrimeira: null })).toBeNull()
  })
})

describe('rotulosDaSerie', () => {
  const ponto = (inicio: string) => ({ inicio, conferidos: 0, estourados: 0, futuro: false })

  it('dia da semana na semana, dia do mês no mês, S1…Sn no trimestre', () => {
    const dias = { granularidade: 'Dia' as const, pontos: [ponto('2026-09-21'), ponto('2026-09-22')] }
    expect(rotulosDaSerie(dias, 'Semana')).toEqual(['seg', 'ter'])
    expect(rotulosDaSerie(dias, 'Mes')).toEqual(['21', '22'])
    expect(
      rotulosDaSerie({ granularidade: 'Semana', pontos: [ponto('2026-07-06'), ponto('2026-07-13')] }, 'Trimestre'),
    ).toEqual(['S1', 'S2'])
  })
})

describe('meta e pesos', () => {
  it('texto da meta', () => {
    expect(textoDaMeta(0.9, 0.95)).toBe('meta 95% · faltam 5 pts')
    expect(textoDaMeta(0.97, 0.95)).toBe('meta 95% · atingida')
  })

  it('legenda do score com os pesos configurados', () => {
    expect(legendaDoScore(PESOS_PADRAO)).toBe('score = 40% volume · 30% prazo · 20% qualidade · 10% complexidade')
    expect(legendaDoScore({ volume: 50, prazo: 25, qualidade: 15, complexidade: 10 })).toContain('50% volume')
  })
})
