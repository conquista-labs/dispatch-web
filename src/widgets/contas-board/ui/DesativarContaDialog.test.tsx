import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Conta } from '@/entities/conta'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { DesativarContaDialog } from './DesativarContaDialog'

// Um mock novo por teste (em vez de mockReset no beforeEach): com o reset, o 409 rejeitado do
// terceiro teste virava falha do próprio teste no Vitest 5, mesmo tratado pelo TanStack Query.
const api = vi.hoisted(() => ({ desativar: vi.fn() }))
vi.mock('@/features/conta/desativar/api/desativar-conta', () => ({
  desativarConta: (...args: unknown[]) => api.desativar(...args),
}))

const conta = (sobrescreve: Partial<Conta>): Conta => ({
  id: 'c-1',
  nome: 'Letícia Andrade',
  email: 'leticia@cartorio.com',
  papel: 'Distribuidora',
  ativo: true,
  tambemConfere: false,
  ehVoce: false,
  ...sobrescreve,
})

const eu = conta({ id: 'eu', nome: 'Maria Vittoria', papel: 'Administrador', ehVoce: true })

// Só o formato que `isAxiosError` reconhece.
const erro409 = (codigo: string) => ({ isAxiosError: true, response: { status: 409, data: { codigo } } })

describe('DesativarContaDialog', () => {
  beforeEach(() => {
    api.desativar = vi.fn()
  })

  it('confirmação normal: avisa que o pool recebe os protocolos de quem também confere e desativa', async () => {
    api.desativar.mockResolvedValue(undefined)
    const onFechar = vi.fn()
    const alvo = conta({ tambemConfere: true })
    renderWithProviders(<DesativarContaDialog conta={alvo} contas={[eu, alvo]} onFechar={onFechar} />)

    expect(screen.getByText('Desativar a conta de Letícia Andrade?')).toBeInTheDocument()
    expect(screen.getByText(/Os protocolos que estão com Letícia voltam para o pool\./)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Desativar conta' }))

    await waitFor(() => expect(onFechar).toHaveBeenCalled())
    expect(api.desativar.mock.calls[0][0]).toBe('c-1')
  })

  it('a própria conta abre direto o aviso com "Entendi", sem chamar a API', async () => {
    const outraAdmin = conta({ id: 'a2', papel: 'Administrador' })
    const onFechar = vi.fn()
    renderWithProviders(<DesativarContaDialog conta={eu} contas={[eu, outraAdmin]} onFechar={onFechar} />)

    expect(screen.getByText('Não é possível desativar Maria Vittoria')).toBeInTheDocument()
    expect(
      screen.getByText('Você não pode desativar a sua própria conta. Peça a outro administrador.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desativar conta' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Entendi' }))

    expect(onFechar).toHaveBeenCalled()
    expect(api.desativar).not.toHaveBeenCalled()
  })

  it('um 409 de trava do back (lista velha) troca a confirmação pelo aviso', async () => {
    api.desativar.mockRejectedValue(erro409('ultimo_administrador'))
    const alvo = conta({ id: 'a2', nome: 'Rita Souza', papel: 'Administrador' })
    const outraAdmin = conta({ id: 'a3', papel: 'Administrador' })
    renderWithProviders(<DesativarContaDialog conta={alvo} contas={[eu, alvo, outraAdmin]} onFechar={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Desativar conta' }))

    expect(await screen.findByText(/^Rita é o último administrador ativo\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument()
  })
})
