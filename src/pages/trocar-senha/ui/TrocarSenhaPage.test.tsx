import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type Usuario, useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'

import { TrocarSenhaPage } from './TrocarSenhaPage'

// Um mock novo por teste — ver o comentário em widgets/contas-board/ui/DesativarContaDialog.test.tsx.
const api = vi.hoisted(() => ({ trocar: vi.fn() }))
vi.mock('@/features/auth/trocar-senha/api/trocar-senha', () => ({
  trocarSenha: (...args: unknown[]) => api.trocar(...args),
}))

const pendente: Usuario = {
  id: 'u-1',
  nome: 'Letícia Andrade',
  email: 'leticia@cartorio.com',
  papeis: ['Distribuidora'],
  trocarSenha: true,
}

const renderizar = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.trocarSenha]}>
        <Routes>
          <Route path={ROUTES.trocarSenha} element={<TrocarSenhaPage />} />
          <Route path={ROUTES.dashboard} element={<div>tela inicial</div>} />
          <Route path={ROUTES.login} element={<div>tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const preencher = async (atual: string, nova: string) => {
  await userEvent.type(screen.getByLabelText('Senha inicial'), atual)
  await userEvent.type(screen.getByLabelText('Nova senha'), nova)
  await userEvent.type(screen.getByLabelText('Repita a nova senha'), nova)
}

describe('TrocarSenhaPage', () => {
  beforeEach(() => {
    api.trocar = vi.fn()
    useSessionStore.setState({ token: 'token-inicial', usuario: pendente })
  })

  it('sem sessão vai pro login; sem troca pendente vai pra tela inicial', () => {
    useSessionStore.setState({ token: null, usuario: null })
    const { unmount } = renderizar()
    expect(screen.getByText('tela de login')).toBeInTheDocument()
    unmount()

    useSessionStore.setState({ token: 't', usuario: { ...pendente, trocarSenha: false } })
    renderizar()
    expect(screen.getByText('tela inicial')).toBeInTheDocument()
  })

  it('só libera o botão com a senha inicial preenchida e a nova batendo as regras', async () => {
    renderizar()
    const botao = screen.getByRole('button', { name: 'Salvar e entrar' })
    expect(botao).toBeDisabled()

    await preencher('abcd-efgh-12', 'curta')
    expect(botao).toBeDisabled()

    await userEvent.clear(screen.getByLabelText('Nova senha'))
    await userEvent.clear(screen.getByLabelText('Repita a nova senha'))
    await userEvent.type(screen.getByLabelText('Nova senha'), 'uma frase longa e boa')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'uma frase longa e boa')
    expect(botao).toBeEnabled()
  })

  it('troca, guarda o token novo sem a marca e segue pra tela inicial', async () => {
    api.trocar.mockResolvedValue({ token: 'token-novo' })
    renderizar()

    await preencher('abcd-efgh-12', 'uma frase longa e boa')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar e entrar' }))

    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
    expect(api.trocar.mock.calls[0][0]).toEqual({ senhaAtual: 'abcd-efgh-12', novaSenha: 'uma frase longa e boa' })
    expect(useSessionStore.getState().token).toBe('token-novo')
    expect(useSessionStore.getState().usuario?.trocarSenha).toBe(false)
  })

  it('senha inicial errada vira mensagem própria e a pessoa continua na tela', async () => {
    api.trocar.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { codigo: 'senha_atual_incorreta' } },
    })
    renderizar()

    await preencher('errada', 'uma frase longa e boa')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar e entrar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('A senha inicial não confere.'))
    expect(useSessionStore.getState().usuario?.trocarSenha).toBe(true)
  })
})
