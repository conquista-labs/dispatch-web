import { describe, expect, it } from 'vitest'

import type { InfoProtocolo, ProtocoloResumo } from '../model/types'
import { chaveDoDiaLocal, contagemFiltrosAtivos, filtroVazio, protocoloPassaNoFiltro } from './filtros'

const AGORA = new Date('2026-08-28T12:00:00Z').getTime()

const novoProtocolo = (sobrescreve: Partial<ProtocoloResumo> = {}): ProtocoloResumo => ({
  id: '1',
  numero: '123',
  tipoAtoId: 'tipo-a',
  escreventeId: 'escrevente-1',
  etapa: 'PosConferencia',
  prioridade: 'Normal',
  status: 'Pool',
  donoId: null,
  vencimentoEm: null,
  motivoExcecao: null,
  observacao: null,
  semaforo: null,
  iniciadoEm: null,
  pausadoEm: null,
  concluidoEm: null,
  duracao: null,
  andamentoEm: '2026-08-28T09:00:00Z',
  numeroDaConferencia: 1,
  ...sobrescreve,
})

const novaInfo = (sobrescreve: Partial<InfoProtocolo> = {}): InfoProtocolo => ({
  tipoAtoNome: 'Inventário',
  escreventeNome: 'Fulano',
  equipeId: 'equipe-a',
  equipeNome: '5º andar',
  ...sobrescreve,
})

describe('filtroVazio', () => {
  it('não filtra nada e não conta como filtro ativo', () => {
    const filtro = filtroVazio()
    expect(contagemFiltrosAtivos(filtro)).toBe(0)
    expect(protocoloPassaNoFiltro(novoProtocolo(), novaInfo(), filtro, AGORA)).toBe(true)
  })
})

describe('contagemFiltrosAtivos', () => {
  it('conta só os 4 eixos combináveis — texto e data ficam de fora do badge', () => {
    expect(contagemFiltrosAtivos({ ...filtroVazio(), equipeIds: ['a'] })).toBe(1)
    expect(contagemFiltrosAtivos({ ...filtroVazio(), tipoAtoIds: ['a'], prioridades: ['Alta'] })).toBe(2)
    expect(contagemFiltrosAtivos({ ...filtroVazio(), urgente: true })).toBe(1)
    expect(contagemFiltrosAtivos({ ...filtroVazio(), texto: 'busca', data: '2026-08-28' })).toBe(0)
  })
})

describe('chaveDoDiaLocal', () => {
  it('extrai ano-mês-dia no fuso local, com zero à esquerda', () => {
    expect(chaveDoDiaLocal('2026-01-05T10:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('protocoloPassaNoFiltro', () => {
  it('eixo equipe: bloqueia quando a equipe do protocolo não está na lista, "sem equipe" é null', () => {
    const filtro = { ...filtroVazio(), equipeIds: ['equipe-a'] }
    expect(protocoloPassaNoFiltro(novoProtocolo(), novaInfo({ equipeId: 'equipe-a' }), filtro, AGORA)).toBe(true)
    expect(protocoloPassaNoFiltro(novoProtocolo(), novaInfo({ equipeId: 'equipe-b' }), filtro, AGORA)).toBe(false)

    const filtroSemEquipe = { ...filtroVazio(), equipeIds: [null] }
    expect(protocoloPassaNoFiltro(novoProtocolo(), novaInfo({ equipeId: null }), filtroSemEquipe, AGORA)).toBe(true)
  })

  it('eixo tipo de ato: bloqueia quando o tipo não está na lista, ou é desconhecido (null)', () => {
    const filtro = { ...filtroVazio(), tipoAtoIds: ['tipo-a'] }
    expect(protocoloPassaNoFiltro(novoProtocolo({ tipoAtoId: 'tipo-a' }), novaInfo(), filtro, AGORA)).toBe(true)
    expect(protocoloPassaNoFiltro(novoProtocolo({ tipoAtoId: 'tipo-b' }), novaInfo(), filtro, AGORA)).toBe(false)
    expect(protocoloPassaNoFiltro(novoProtocolo({ tipoAtoId: null }), novaInfo(), filtro, AGORA)).toBe(false)
  })

  it('eixo prioridade: filtra pelo conjunto marcado', () => {
    const filtro = { ...filtroVazio(), prioridades: ['Alta' as const] }
    expect(protocoloPassaNoFiltro(novoProtocolo({ prioridade: 'Alta' }), novaInfo(), filtro, AGORA)).toBe(true)
    expect(protocoloPassaNoFiltro(novoProtocolo({ prioridade: 'Normal' }), novaInfo(), filtro, AGORA)).toBe(false)
  })

  it('eixo urgente: prioridade Alta OU vence em menos de 4h a partir de "now"', () => {
    const filtro = { ...filtroVazio(), urgente: true }

    // Prioridade Alta passa mesmo sem vencimento perto.
    expect(
      protocoloPassaNoFiltro(novoProtocolo({ prioridade: 'Alta', vencimentoEm: null }), novaInfo(), filtro, AGORA),
    ).toBe(true)

    // Vence daqui a 3h — dentro do limiar de 4h.
    const vence3h = new Date(AGORA + 3 * 60 * 60 * 1000).toISOString()
    expect(
      protocoloPassaNoFiltro(novoProtocolo({ prioridade: 'Normal', vencimentoEm: vence3h }), novaInfo(), filtro, AGORA),
    ).toBe(true)

    // Vence daqui a 5h — fora do limiar, prioridade normal.
    const vence5h = new Date(AGORA + 5 * 60 * 60 * 1000).toISOString()
    expect(
      protocoloPassaNoFiltro(novoProtocolo({ prioridade: 'Normal', vencimentoEm: vence5h }), novaInfo(), filtro, AGORA),
    ).toBe(false)

    // Já venceu (vencimento no passado) — também está "vencendo em menos de 4h" (negativo < limiar).
    const venceu = new Date(AGORA - 60_000).toISOString()
    expect(
      protocoloPassaNoFiltro(novoProtocolo({ prioridade: 'Normal', vencimentoEm: venceu }), novaInfo(), filtro, AGORA),
    ).toBe(true)
  })

  it('eixo data: compara a chave do dia local do vencimento com o filtro', () => {
    const filtro = { ...filtroVazio(), data: '2026-08-28' }
    const mesmoDia = novoProtocolo({ vencimentoEm: '2026-08-28T10:00:00' })
    const outroDia = novoProtocolo({ vencimentoEm: '2026-08-29T10:00:00' })
    const semVencimento = novoProtocolo({ vencimentoEm: null })

    expect(protocoloPassaNoFiltro(mesmoDia, novaInfo(), filtro, AGORA)).toBe(true)
    expect(protocoloPassaNoFiltro(outroDia, novaInfo(), filtro, AGORA)).toBe(false)
    expect(protocoloPassaNoFiltro(semVencimento, novaInfo(), filtro, AGORA)).toBe(false)
  })

  it('busca livre: procura no número, tipo, escrevente, equipe e observação, sem diferenciar maiúsculas', () => {
    const filtro = { ...filtroVazio(), texto: 'INVENTÁRIO' }
    expect(protocoloPassaNoFiltro(novoProtocolo(), novaInfo({ tipoAtoNome: 'Inventário' }), filtro, AGORA)).toBe(true)
    expect(protocoloPassaNoFiltro(novoProtocolo(), novaInfo({ tipoAtoNome: 'Compra e Venda' }), filtro, AGORA)).toBe(
      false,
    )

    const filtroPorObservacao = { ...filtroVazio(), texto: 'urgência' }
    expect(
      protocoloPassaNoFiltro(
        novoProtocolo({ observacao: 'cliente pediu urgência' }),
        novaInfo({ tipoAtoNome: 'Outro' }),
        filtroPorObservacao,
        AGORA,
      ),
    ).toBe(true)
  })
})
