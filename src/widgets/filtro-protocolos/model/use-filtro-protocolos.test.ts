import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'

import { useFiltroProtocolos } from './use-filtro-protocolos'

// `protocoloPassaNoFiltro` (a função pura embaixo deste hook) já tem suíte própria em
// entities/protocolo/lib/filtros.test.ts. O que nunca foi exercitado é a FIAÇÃO de estado em
// volta dela: alternar liga e desliga, contagem é sempre contra o conjunto completo (não o
// recorte já filtrado — RF-18e), e `limpar` volta tudo ao início.
const AGORA = new Date('2026-03-10T12:00:00Z').getTime()

const protocolo = (patch: Partial<ProtocoloResumo> & Pick<ProtocoloResumo, 'id'>): ProtocoloResumo => ({
  numero: `9000${patch.id}`,
  tipoAtoId: null,
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
  andamentoEm: '2026-03-10T09:00:00Z',
  numeroDaConferencia: 1,
  ...patch,
})

const EQUIPE_A = 'equipe-a'
const TIPO_VENDA = 'tipo-venda'

const protocolos: ProtocoloResumo[] = [
  protocolo({ id: '1', tipoAtoId: TIPO_VENDA, prioridade: 'Alta' }),
  protocolo({ id: '2', tipoAtoId: TIPO_VENDA }),
  protocolo({ id: '3', escreventeId: 'escrevente-sem-equipe' }),
]

const infoPorProtocolo: Record<string, InfoProtocolo> = {
  '1': { tipoAtoNome: 'Venda e Compra', escreventeNome: 'Ana', equipeId: EQUIPE_A, equipeNome: 'Equipe A' },
  '2': { tipoAtoNome: 'Venda e Compra', escreventeNome: 'Ana', equipeId: EQUIPE_A, equipeNome: 'Equipe A' },
  '3': { tipoAtoNome: null, escreventeNome: 'Bruno', equipeId: null, equipeNome: null },
}

const renderizar = () =>
  renderHook(() =>
    useFiltroProtocolos({
      protocolos,
      resolverInfo: (p) => infoPorProtocolo[p.id],
      equipes: [{ id: EQUIPE_A, nome: 'Equipe A' }],
      tiposAto: [{ id: TIPO_VENDA, nome: 'Venda e Compra' }],
      now: AGORA,
    }),
  )

describe('useFiltroProtocolos', () => {
  it('sem filtro nenhum, tudo passa e o badge fica zerado', () => {
    const { result } = renderizar()

    expect(protocolos.filter(result.current.passaNoFiltro)).toHaveLength(3)
    expect(result.current.contagemFiltrosAtivos).toBe(0)
  })

  it('alternar equipe liga e desliga o mesmo eixo', () => {
    const { result } = renderizar()

    act(() => result.current.alternarEquipe(EQUIPE_A))
    expect(protocolos.filter(result.current.passaNoFiltro).map((p) => p.id)).toEqual(['1', '2'])
    expect(result.current.contagemFiltrosAtivos).toBe(1)

    act(() => result.current.alternarEquipe(EQUIPE_A))
    expect(protocolos.filter(result.current.passaNoFiltro)).toHaveLength(3)
    expect(result.current.contagemFiltrosAtivos).toBe(0)
  })

  it('"sem equipe" é um valor de filtro legítimo, não ausência de filtro', () => {
    const { result } = renderizar()

    act(() => result.current.alternarEquipe(null))

    expect(protocolos.filter(result.current.passaNoFiltro).map((p) => p.id)).toEqual(['3'])
  })

  it('eixos diferentes se combinam com E, não com OU', () => {
    const { result } = renderizar()

    act(() => result.current.alternarTipoAto(TIPO_VENDA))
    act(() => result.current.alternarPrioridade('Alta'))

    expect(protocolos.filter(result.current.passaNoFiltro).map((p) => p.id)).toEqual(['1'])
    expect(result.current.contagemFiltrosAtivos).toBe(2)
  })

  it('contagem por opção é contra o conjunto completo, não contra o recorte já filtrado (RF-18e)', () => {
    const { result } = renderizar()

    act(() => result.current.alternarEquipe(null))

    // Equipe A segue contando 2 mesmo com o filtro atual isolando só o protocolo sem equipe —
    // "a gestão sabe o tamanho do recorte antes de aplicar".
    const equipeA = result.current.contagens.equipes.find((o) => o.valor === EQUIPE_A)
    expect(equipeA?.contagem).toBe(2)
  })

  it('busca livre e data não entram no badge de filtros ativos', () => {
    const { result } = renderizar()

    act(() => result.current.setTexto('venda'))
    act(() => result.current.setData('2026-03-10'))

    expect(result.current.contagemFiltrosAtivos).toBe(0)
  })

  it('limpar devolve todos os eixos ao estado inicial', () => {
    const { result } = renderizar()

    act(() => result.current.alternarTipoAto(TIPO_VENDA))
    act(() => result.current.setTexto('venda'))
    act(() => result.current.limpar())

    expect(result.current.contagemFiltrosAtivos).toBe(0)
    expect(result.current.filtro.texto).toBe('')
    expect(protocolos.filter(result.current.passaNoFiltro)).toHaveLength(3)
  })
})
