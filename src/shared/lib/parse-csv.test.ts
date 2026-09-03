import { describe, expect, it } from 'vitest'

import { dataHoraParaIso, parseCsv } from './parse-csv'

describe('parseCsv', () => {
  it('lê cabeçalho + linhas separados por vírgula, com trim em cada valor', () => {
    const texto = 'protocolo, tipoAto, escrevente\n123, Inventário, Fulano\n456, Compra e Venda, Ciclana'
    expect(parseCsv(texto)).toEqual([
      { protocolo: '123', tipoAto: 'Inventário', escrevente: 'Fulano' },
      { protocolo: '456', tipoAto: 'Compra e Venda', escrevente: 'Ciclana' },
    ])
  })

  it('devolve lista vazia sem nenhuma linha de dado (só cabeçalho ou vazio)', () => {
    expect(parseCsv('protocolo,tipoAto')).toEqual([])
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('   \n  \n')).toEqual([])
  })

  it('ignora linhas em branco no meio/fim do texto colado', () => {
    const texto = 'protocolo,tipoAto\n123,Inventário\n\n456,Compra e Venda\n'
    expect(parseCsv(texto)).toHaveLength(2)
  })

  it('preenche com string vazia quando a linha tem menos campos que o cabeçalho', () => {
    const texto = 'protocolo,tipoAto,escrevente\n123,Inventário'
    expect(parseCsv(texto)).toEqual([{ protocolo: '123', tipoAto: 'Inventário', escrevente: '' }])
  })

  it('ignora valores a mais quando a linha tem mais campos que o cabeçalho', () => {
    const texto = 'protocolo,tipoAto\n123,Inventário,Fulano,extra'
    expect(parseCsv(texto)).toEqual([{ protocolo: '123', tipoAto: 'Inventário' }])
  })
})

describe('dataHoraParaIso', () => {
  it('interpreta a entrada como horário local e converte pra ISO UTC (round-trip preserva os componentes locais)', () => {
    const entrada = '2026-08-26 10:16:53'
    const iso = dataHoraParaIso(entrada)

    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    const voltaParaLocal = new Date(iso)
    expect(voltaParaLocal.getFullYear()).toBe(2026)
    expect(voltaParaLocal.getMonth()).toBe(7) // agosto, 0-indexed
    expect(voltaParaLocal.getDate()).toBe(26)
    expect(voltaParaLocal.getHours()).toBe(10)
    expect(voltaParaLocal.getMinutes()).toBe(16)
    expect(voltaParaLocal.getSeconds()).toBe(53)
  })
})
