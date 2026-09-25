import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PainelDeHoje } from '@/entities/dashboard'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { FaixaDeHoje } from './FaixaDeHoje'

// Um mock novo por teste — ver o comentário em widgets/contas-board/ui/DesativarContaDialog.test.tsx.
const api = vi.hoisted(() => ({ painel: vi.fn(), equipes: vi.fn() }))
vi.mock('@/entities/dashboard/api/get-painel-de-hoje', () => ({
  getPainelDeHoje: (...args: unknown[]) => api.painel(...args),
}))
vi.mock('@/entities/equipe/api/get-equipes', () => ({ getEquipes: (...args: unknown[]) => api.equipes(...args) }))

const painelGestao: PainelDeHoje = {
  visao: 'Gestao',
  atualizadoEm: '2026-09-25T15:44:00Z',
  conferidosHoje: 36,
  naFila: { pool: 6, comConferente: 11 },
  naMao: null,
  emRisco: { estourados: 2, vencemEmUmaHora: 1 },
  excecoes: 1,
  gargalo: { equipeId: 'e1', quantidade: 4 },
}

describe('FaixaDeHoje', () => {
  beforeEach(() => {
    api.painel = vi.fn()
    api.equipes = vi.fn().mockResolvedValue([{ id: 'e1', nome: 'Quinto Andar' }])
  })

  it('gestão: "Hoje, agora" com cada célula levando à aba da Distribuição e o gargalo nomeado', async () => {
    api.painel.mockResolvedValue(painelGestao)
    renderWithProviders(<FaixaDeHoje />)

    expect(await screen.findByText('Hoje, agora')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Exceções/ })).toHaveAttribute('href', '/distribuicao?aba=excecoes')
    expect(screen.getByRole('link', { name: /Na fila/ })).toHaveAttribute('href', '/distribuicao?aba=conferente')
    expect(
      await screen.findByText('Quinto Andar concentra 4 dos protocolos estourados ou vencendo em 1h.'),
    ).toBeInTheDocument()
  })

  it('conferente: "Seu dia" com três números e só o link da própria fila', async () => {
    api.painel.mockResolvedValue({
      ...painelGestao,
      visao: 'Conferente',
      naFila: null,
      excecoes: null,
      gargalo: null,
      naMao: { total: 2, emConferencia: 1 },
    })
    renderWithProviders(<FaixaDeHoje />)

    expect(await screen.findByText('Seu dia')).toBeInTheDocument()
    expect(screen.getByText('Na sua mão')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Abrir minha fila →' })).toHaveAttribute('href', '/minha-fila')
  })

  it('sem o endpoint (API antiga), a faixa não aparece', async () => {
    api.painel.mockRejectedValue({ isAxiosError: true, response: { status: 404, data: {} } })
    const { container } = renderWithProviders(<FaixaDeHoje />)

    await waitFor(() => expect(api.painel).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
