import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Conferente } from '@/entities/conferente'
import type { Equipe } from '@/entities/equipe'
import type { TipoAto } from '@/entities/tipoAto'

import { SEM_EQUIPE } from '../lib/sem-equipe'
import { useAlcadaBuilder } from './use-alcada-builder'

// `criarRegraAlcada` (api/) mockada — testa a FIAÇÃO do builder (estado derivado, guardas de
// "pode criar", montagem do request), não o POST em si (isso é infra do TanStack Query).
const mutateAsync = vi.fn().mockResolvedValue({ regraId: 'nova' })
vi.mock('@/features/regra-alcada/criar/api/criar-regra-alcada', () => ({
  criarRegraAlcada: (...args: unknown[]) => mutateAsync(...args),
}))

const conferentes: Conferente[] = [
  {
    id: 'c1',
    nome: 'Ana',
    email: 'ana@x.com',
    nivel: 'Pleno',
    jornadaHoras: 8,
    naEscala: true,
    ativo: true,
    cargaAtual: 0,
    capacidadeEstimada: 20,
  },
]
const equipes: Equipe[] = [{ id: 'eq1', nome: 'Equipe RIO', prazoPreConferencia: 'D1', prazoPosConferencia: 'D1' }]
const tiposAto: TipoAto[] = [{ id: 't1', nome: 'Venda e Compra', ativo: true, grupo: null }]

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const montar = () =>
  renderHook(
    () =>
      useAlcadaBuilder({
        conferentes,
        equipes,
        tiposAto,
        nomePorConferenteId: new Map([['c1', 'Ana']]),
        nomePorTipoAtoId: new Map([['t1', 'Venda e Compra']]),
        nomePorEquipeId: new Map([['eq1', 'Equipe RIO']]),
      }),
    { wrapper },
  )

// RF-32: o construtor guiado — extraído de AbaAlcada.tsx numa auditoria de qualidade. Cobre o
// que mais risco de regressão silenciosa tem: os textos derivados (quemTexto/alvoTexto), as
// guardas de "pode criar", e a montagem do request — especialmente o alvo "equipe não faz
// etapa" (Motor v4), que é a correção de um bug real relatado em produção (criar só pra 1
// nível quando o pedido sempre foi "ninguém, independente de nível").
describe('useAlcadaBuilder', () => {
  beforeEach(() => mutateAsync.mockClear())

  it('abrir() reseta o builder pro primeiro conferente e abre o construtor', () => {
    const { result } = renderHook(
      () =>
        useAlcadaBuilder({
          conferentes,
          equipes,
          tiposAto,
          nomePorConferenteId: new Map(),
          nomePorTipoAtoId: new Map(),
          nomePorEquipeId: new Map(),
        }),
      { wrapper },
    )

    act(() => result.current.abrir())

    expect(result.current.aberto).toBe(true)
    expect(result.current.builder.sujeitoConferenteId).toBe('c1')
  })

  it('quemTexto mostra o nível quando sujeito é nível, e o nome resolvido quando é pessoa', () => {
    const { result } = montar()

    expect(result.current.quemTexto).toBe('Nível Júnior')

    act(() => result.current.setBuilder((b) => ({ ...b, sujeitoTipo: 'pessoa', sujeitoConferenteId: 'c1' })))
    expect(result.current.quemTexto).toBe('Ana')
  })

  it('alvoTexto some com "…" quando nada foi selecionado ainda', () => {
    const { result } = montar()
    expect(result.current.alvoTexto).toBe('…')
  })

  it('alvoTexto pra "equipe" trata SEM_EQUIPE como "sem equipe", não um id cru', () => {
    const { result } = montar()

    act(() => result.current.setAlvoTipo('equipe'))
    act(() => result.current.setBuilder((b) => ({ ...b, alvoSelecionados: ['eq1', SEM_EQUIPE] })))

    expect(result.current.alvoTexto).toContain('da equipe Equipe RIO')
    expect(result.current.alvoTexto).toContain('de escreventes sem equipe')
  })

  it('setAlvoTipo("equipeEtapa") trava permissão em Nega e sujeito em nível', () => {
    const { result } = montar()

    act(() => result.current.setBuilder((b) => ({ ...b, sujeitoTipo: 'pessoa', permissao: 'Permite' })))
    act(() => result.current.setAlvoTipo('equipeEtapa'))

    expect(result.current.builder.permissao).toBe('Nega')
    expect(result.current.builder.sujeitoTipo).toBe('nivel')
  })

  it('alternarEtapaEquipeEEtapa liga e desliga a etapa selecionada', () => {
    const { result } = montar()
    act(() => result.current.setAlvoTipo('equipeEtapa'))

    act(() => result.current.alternarEtapaEquipeEEtapa('PreConferencia'))
    expect(result.current.builder.equipeEEtapaEtapas).toEqual(['PreConferencia'])

    act(() => result.current.alternarEtapaEquipeEEtapa('PreConferencia'))
    expect(result.current.builder.equipeEEtapaEtapas).toEqual([])
  })

  it('podeCriar é true pro alvo "todos" mesmo sem seleção nenhuma', () => {
    const { result } = montar()
    act(() => result.current.setAlvoTipo('todos'))
    expect(result.current.podeCriar).toBe(true)
  })

  it('podeCriar exige conferenteId quando sujeito é pessoa, mesmo com alvo selecionado', () => {
    const { result } = montar()
    act(() => result.current.setAlvoTipo('tipo'))
    act(() =>
      result.current.setBuilder((b) => ({
        ...b,
        alvoSelecionados: ['t1'],
        sujeitoTipo: 'pessoa',
        sujeitoConferenteId: '',
      })),
    )

    expect(result.current.podeCriar).toBe(false)
  })

  it('handleCriarRegra("todos") cria uma regra com alvoTodosOsAtos e fecha o construtor', async () => {
    const { result } = montar()
    act(() => result.current.abrir())
    act(() => result.current.setAlvoTipo('todos'))

    await act(() => result.current.handleCriarRegra())

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    // TanStack Query v5 passa um 2º argumento pra toda mutationFn ({ client, meta, mutationKey })
    // — `toHaveBeenCalledWith` compararia os dois args, então olha `mock.calls[0][0]` direto.
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ alvoTodosOsAtos: true, permissao: 'Permite' })
    await waitFor(() => expect(result.current.aberto).toBe(false))
  })

  it('handleCriarRegra("tipo") com 2 selecionados cria 2 regras, uma por alvo (back não aceita alvo composto)', async () => {
    const { result } = montar()
    act(() => result.current.setAlvoTipo('tipo'))
    act(() => result.current.setBuilder((b) => ({ ...b, alvoSelecionados: ['t1', 't2'] })))

    await act(() => result.current.handleCriarRegra())

    expect(mutateAsync).toHaveBeenCalledTimes(2)
    const alvos = mutateAsync.mock.calls.map(([req]) => (req as { alvoTipoAtoId: string }).alvoTipoAtoId)
    expect(alvos.sort()).toEqual(['t1', 't2'])
  })

  it('handleCriarRegra("equipeEtapa") cria pros 3 níveis × cada combo equipe×etapa — não só 1 nível', async () => {
    const { result } = montar()
    act(() => result.current.setAlvoTipo('equipeEtapa'))
    act(() => result.current.setBuilder((b) => ({ ...b, alvoSelecionados: ['eq1'] })))
    act(() => result.current.alternarEtapaEquipeEEtapa('PreConferencia'))

    await act(() => result.current.handleCriarRegra())

    // 1 equipe × 1 etapa × 3 níveis = 3 chamadas — a correção do bug real (antes só criava 1).
    expect(mutateAsync).toHaveBeenCalledTimes(3)
    const niveis = mutateAsync.mock.calls.map(([req]) => (req as { sujeitoNivel: string }).sujeitoNivel)
    expect(niveis.sort()).toEqual(['Junior', 'Pleno', 'Senior'])
    for (const [req] of mutateAsync.mock.calls) {
      expect(req).toMatchObject({
        permissao: 'Nega',
        alvoEhEquipeEEtapa: true,
        alvoEquipeId: 'eq1',
        alvoEtapa: 'PreConferencia',
      })
    }
  })

  it('handleCriarRegra("equipeEtapa") com equipe "sem equipe" manda alvoEquipeId null, não o sentinel cru', async () => {
    const { result } = montar()
    act(() => result.current.setAlvoTipo('equipeEtapa'))
    act(() => result.current.setBuilder((b) => ({ ...b, alvoSelecionados: [SEM_EQUIPE] })))
    act(() => result.current.alternarEtapaEquipeEEtapa('PosConferencia'))

    await act(() => result.current.handleCriarRegra())

    for (const [req] of mutateAsync.mock.calls) {
      expect((req as { alvoEquipeId: unknown }).alvoEquipeId).toBeNull()
    }
  })
})
