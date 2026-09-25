import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMinhaFila } from '@/entities/protocolo/api/get-minha-fila'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'
import { TooltipProvider } from '@/shared/ui/tooltip'

import { protocoloDeTeste } from '../lib/test/protocolo-de-teste'
import { MinhaFilaBoard } from './MinhaFilaBoard'

// Só a rede é mockada — hooks, filtro, faixa e cards são os de verdade.
vi.mock('@/entities/protocolo/api/get-minha-fila', () => ({ getMinhaFila: vi.fn() }))
vi.mock('@/entities/protocolo/api/get-concluidos-hoje', () => ({ getConcluidosHoje: vi.fn().mockResolvedValue([]) }))
vi.mock('@/entities/escrevente/api/get-escreventes', () => ({ getEscreventes: vi.fn().mockResolvedValue([]) }))
vi.mock('@/entities/equipe/api/get-equipes', () => ({ getEquipes: vi.fn().mockResolvedValue([]) }))
vi.mock('@/entities/tipoAto/api/get-tipos-ato', () => ({ getTiposAto: vi.fn().mockResolvedValue([]) }))
vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }))

beforeAll(() => {
  // jsdom não implementa rolagem nem CSS.escape.
  Element.prototype.scrollIntoView = vi.fn()
  if (!globalThis.CSS?.escape) globalThis.CSS = { escape: (valor: string) => valor } as typeof CSS
})

// RF-24j, ponta a ponta no board: o protocolo alto é o 6º do pool (além dos 5 visíveis no
// desktop), então o "Ver" da faixa precisa abrir a lista completa e destacar o card lá dentro.
describe('MinhaFilaBoard — "Ver" da faixa de prioridade alta', () => {
  beforeEach(() => {
    const pool = Array.from({ length: 7 }, (_, i) =>
      protocoloDeTeste(`P${i + 1}`, {
        vencimentoEm: `2026-09-26T1${i}:00:00Z`,
        prioridade: i === 5 ? 'Alta' : 'Normal',
      }),
    )
    vi.mocked(getMinhaFila).mockResolvedValue({ poolDisponivel: pool, atribuidos: [], emConferencia: [] })
  })

  it('abre a lista completa do pool e destaca o card', async () => {
    renderWithProviders(
      <TooltipProvider>
        <MinhaFilaBoard />
      </TooltipProvider>,
    )

    const faixa = await screen.findByRole('status')
    expect(faixa).toHaveTextContent('1 protocolo com prioridade alta')
    // Antes do "Ver", o P6 só existe na lista completa (fechada).
    expect(document.querySelector('[data-protocolo-id="P6"]')).toBeNull()

    await userEvent.click(within(faixa).getByRole('button', { name: 'P6 · pool →' }))

    const lista = await screen.findByRole('dialog', { name: /Pool disponível · 7/ })
    const card = within(lista).getByText('P6').closest('[data-protocolo-id]')
    expect(card).toHaveAttribute('data-protocolo-id', 'P6')
    expect(card?.className).toContain('ring-2')
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
  })
})
