import { describe, expect, it } from 'vitest'

import type { DesempenhoTipoAto } from '@/entities/dashboard'

import {
  contagem,
  diasUteisEntre,
  diasUteisNoPeriodo,
  formatarMediaDiaria,
  faixaDoTempoPorTipo,
  formatarComplexidade,
  tomDaAprovacao,
  tomDoPrazo,
} from './apresentacao'

const tipo = (nome: string, tempoMedio: string | null): DesempenhoTipoAto => ({
  tipoAtoId: nome,
  nome,
  volume: 1,
  tempoMedio,
  percentualReprovacao: 0,
})

describe('apresentação do Dashboard', () => {
  it('conta só segunda a sexta dentro da janela móvel', () => {
    const quinta = new Date(2026, 8, 24, 10)
    expect(diasUteisNoPeriodo('Semana', quinta)).toBe(5)
    expect(diasUteisNoPeriodo('Mes', quinta)).toBe(22)
  })

  it('dias úteis do início do período até hoje (calendário)', () => {
    expect(diasUteisEntre(new Date(2026, 8, 1), new Date(2026, 8, 25, 15))).toBe(19)
    expect(diasUteisEntre(new Date(2026, 8, 21), new Date(2026, 8, 21, 9))).toBe(1)
  })

  it('cores por limiar da tabela do protótipo', () => {
    expect([tomDoPrazo(0.9), tomDoPrazo(0.85), tomDoPrazo(0.79)]).toEqual(['ok', 'warn', 'bad'])
    expect([tomDaAprovacao(0.85), tomDaAprovacao(0.8), tomDaAprovacao(0.7)]).toEqual(['ok', 'warn', 'bad'])
  })

  it('complexidade com duas casas e "×"', () => {
    expect(formatarComplexidade(1.3166)).toBe('1,32×')
    expect(formatarComplexidade(1)).toBe('1,00×')
  })

  it('faixa do tempo médio entre o tipo mais rápido e o mais lento', () => {
    expect(
      faixaDoTempoPorTipo([
        tipo('Venda e Compra', '00:15:00'),
        tipo('Testamento', '00:44:00'),
        tipo('Sem medida', null),
      ]),
    ).toBe('varia de 15 min (venda e compra) a 44 min (testamento)')
    expect(faixaDoTempoPorTipo([tipo('Venda e Compra', '00:15:00')])).toBeNull()
  })

  it('plural dos textos de apoio', () => {
    expect(contagem(0, 'nenhum estourou', 'estourou', 'estouraram')).toBe('nenhum estourou')
    expect(contagem(1, 'nenhum estourou', 'estourou', 'estouraram')).toBe('1 estourou')
    expect(contagem(3, 'nenhum estourou', 'estourou', 'estouraram')).toBe('3 estouraram')
  })

  it('média diária com uma casa abaixo de 10', () => {
    expect(formatarMediaDiaria(90.6)).toBe('91')
    expect(formatarMediaDiaria(0.27)).toBe('0,3')
  })
})
