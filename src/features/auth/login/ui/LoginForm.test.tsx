import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { LoginForm } from './LoginForm'

// Mocka só a chamada HTTP da própria slice (api/login), não o hook nem o axios inteiro: o
// caminho real `LoginForm → useLogin → login()` continua sendo exercitado de verdade. Regra
// herdada da skill `gate` do swap-benefits-web: mock esconde default — o que vive dentro de
// api/ se testa em api/, o teste do componente afirma só a contribuição do chamador.
const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }))
vi.mock('../api/login', () => ({ login: loginMock }))

const usuario = { id: 'u-1', nome: 'Distribuidora Teste', email: 'dist@cartorio.com', papeis: ['Distribuidora'] }

describe('LoginForm', () => {
  beforeEach(() => {
    loginMock.mockReset()
    localStorage.clear()
  })

  it('envia exatamente o que foi digitado', async () => {
    loginMock.mockResolvedValue({ token: 'jwt-de-teste', usuario })
    renderWithProviders(<LoginForm />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'dist@cartorio.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Senha123!')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    // Só o 1º argumento: o TanStack Query v5 passa um 2º parâmetro de contexto
    // (`{ client, meta, mutationKey }`) pra toda `mutationFn` — um `toHaveBeenCalledWith`
    // com só o payload falha por causa dele, mesmo o payload estando correto.
    await waitFor(() => expect(loginMock).toHaveBeenCalled())
    expect(loginMock.mock.calls[0][0]).toEqual({ email: 'dist@cartorio.com', senha: 'Senha123!' })
  })

  it('mostra erro genérico quando a API rejeita — sem dizer se foi e-mail ou senha', async () => {
    loginMock.mockRejectedValue(new Error('401'))
    renderWithProviders(<LoginForm />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'dist@cartorio.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
  })

  it('não mostra erro antes de tentar', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.queryByText('E-mail ou senha incorretos.')).not.toBeInTheDocument()
  })

  it('a senha nasce oculta e o olho revela — sem usar a palavra "senha" no aria-label', async () => {
    renderWithProviders(<LoginForm />)

    const campoSenha = screen.getByLabelText('Senha')
    expect(campoSenha).toHaveAttribute('type', 'password')

    // O aria-label evita "senha" de propósito: getByLabel do Playwright casaria com ele e
    // colidiria com o campo, quebrando toda a suíte e2e (regressão já vivida neste projeto).
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar caracteres digitados' }))

    expect(campoSenha).toHaveAttribute('type', 'text')
  })

  it('esconde os links auxiliares quando embutido em outra tela pública', () => {
    renderWithProviders(<LoginForm mostrarLinksAuxiliares={false} />)

    expect(screen.queryByText('Esqueci minha senha')).not.toBeInTheDocument()
  })
})
