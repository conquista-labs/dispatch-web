import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { NovaContaDialog } from './NovaContaDialog'

// Um mock novo por teste — ver o comentário em DesativarContaDialog.test.tsx.
const api = vi.hoisted(() => ({ criar: vi.fn() }))
vi.mock('@/features/conta/criar/api/criar-conta', () => ({
  criarConta: (...args: unknown[]) => api.criar(...args),
}))

const abrir = async () => {
  renderWithProviders(<NovaContaDialog />)
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
}

const preencher = async (nome: string, email: string, senha: string) => {
  if (nome) await userEvent.type(screen.getByLabelText('Nome'), nome)
  if (email) await userEvent.type(screen.getByLabelText('E-mail'), email)
  if (senha) await userEvent.type(screen.getByLabelText('Senha inicial'), senha)
}

const confirmar = () => userEvent.click(screen.getAllByRole('button', { name: 'Criar conta' }).at(-1)!)

// Só o formato que `isAxiosError` reconhece.
const erroHttp = (status: number, data: object) => ({ isAxiosError: true, response: { status, data } })

describe('NovaContaDialog', () => {
  beforeEach(() => {
    api.criar = vi.fn()
  })

  it('valida como o protótipo antes de chamar a API', async () => {
    await abrir()

    await confirmar()
    expect(screen.getByRole('alert')).toHaveTextContent('Preencha nome, e-mail e senha inicial.')

    await preencher('Letícia', 'leticia', 'abcd1234')
    await confirmar()
    expect(screen.getByRole('alert')).toHaveTextContent('Esse e-mail não parece válido.')

    await userEvent.type(screen.getByLabelText('E-mail'), '@cartorio.com')
    await userEvent.clear(screen.getByLabelText('Senha inicial'))
    await userEvent.type(screen.getByLabelText('Senha inicial'), 'curta')
    await confirmar()
    expect(screen.getByRole('alert')).toHaveTextContent('A senha inicial precisa ter pelo menos 8 caracteres.')

    expect(api.criar).not.toHaveBeenCalled()
  })

  it('"Gerar" preenche uma senha inicial válida e o papel escolhido vai no pedido', async () => {
    api.criar.mockResolvedValue({ usuarioId: 'u-9' })
    await abrir()
    await preencher('  Letícia Andrade ', 'Leticia@Cartorio.com', '')

    await userEvent.click(screen.getByRole('button', { name: 'Gerar' }))
    const senha = (screen.getByLabelText('Senha inicial') as HTMLInputElement).value
    expect(senha).toMatch(/^.{4}-.{4}-\d{2}$/)

    await userEvent.click(screen.getByRole('radio', { name: /Administrador/ }))
    await confirmar()

    await waitFor(() => expect(api.criar).toHaveBeenCalled())
    expect(api.criar.mock.calls[0][0]).toEqual({
      nome: 'Letícia Andrade',
      email: 'leticia@cartorio.com',
      senhaInicial: senha,
      papel: 'Administrador',
    })
  })

  it('e-mail repetido (409) vira mensagem própria', async () => {
    api.criar.mockRejectedValue(erroHttp(409, {}))
    await abrir()
    await preencher('Letícia', 'leticia@cartorio.com', 'abcd-efgh-12')
    await confirmar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta com esse e-mail.')
  })

  it('a descrição da distribuidora diz que ela não edita regras (correção do protótipo, RF-30a)', async () => {
    await abrir()

    expect(screen.getByRole('radio', { name: /Distribuidora/ })).toHaveTextContent('não edita regras')
    expect(screen.getByRole('radio', { name: /Distribuidora/ })).toHaveAttribute('aria-checked', 'true')
  })
})
