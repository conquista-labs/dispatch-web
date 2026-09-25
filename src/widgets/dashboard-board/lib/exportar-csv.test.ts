import { describe, expect, it } from 'vitest'

import type { DesempenhoConferente } from '@/entities/dashboard'

import { gerarCsvDeDesempenho, nomeDoArquivo } from './exportar-csv'

const linha = (sobrescreve: Partial<DesempenhoConferente> = {}): DesempenhoConferente => ({
  conferenteId: 'c1',
  nome: 'Ana Souza',
  nivel: 'Pleno',
  volume: 12,
  tempoMedio: '00:18:00',
  percentualNoPrazo: 0.9166,
  percentualAprovado: 0.8,
  percentualAprovadoNaPrimeira: 0.75,
  complexidadeMedia: 1.3166,
  score: 88,
  faixa: 'Integral',
  parcelas: null,
  ritmo: 0.756,
  tempoMedioReferencia: '00:24:00',
  ...sobrescreve,
})

describe('gerarCsvDeDesempenho', () => {
  it('admin: com nível, score e faixa; separador ";" e vírgula decimal, com BOM', () => {
    const csv = gerarCsvDeDesempenho([linha()], true)
    const [cabecalho, dados] = csv.split('\r\n')

    expect(csv.startsWith('﻿')).toBe(true)
    expect(cabecalho).toBe(
      '﻿Conferente;Nível;Volume;Ritmo;Tempo médio (min);No prazo (%);Aprovados na 1ª (%);Complexidade;Score;Faixa',
    )
    expect(dados).toBe('Ana Souza;Pleno;12;0,76;18;91,7;75,0;1,32;88;Bônus integral')
  })

  it('distribuidora: sem as colunas de avaliação', () => {
    const csv = gerarCsvDeDesempenho([linha({ nivel: null, score: null, faixa: null })], false)
    const [cabecalho, dados] = csv.split('\r\n')

    expect(cabecalho).not.toMatch(/Nível|Score|Faixa/)
    expect(dados).toBe('Ana Souza;12;0,76;18;91,7;75,0;1,32')
  })

  it('valores ausentes ficam vazios e nome com ";" vai entre aspas', () => {
    const [, dados] = gerarCsvDeDesempenho(
      [linha({ nome: 'Souza; Ana "Aninha"', ritmo: null, tempoMedio: null, percentualAprovadoNaPrimeira: null })],
      false,
    ).split('\r\n')

    expect(dados).toBe('"Souza; Ana ""Aninha""";12;;;91,7;;1,32')
  })

  it('nome do arquivo com período e data', () => {
    expect(nomeDoArquivo('Mes', new Date('2026-09-25T12:00:00Z'))).toBe('dispatch-producao-mes-2026-09-25.csv')
  })
})
