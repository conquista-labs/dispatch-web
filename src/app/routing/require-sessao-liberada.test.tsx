import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { type Usuario, useSessionStore } from '@/entities/usuario'
import { ROUTES } from '@/shared/config/routes'

import { RequireSessaoLiberada } from './require-sessao-liberada'

const usuario: Usuario = { id: 'u-1', nome: 'Letícia', email: 'l@cartorio.com', papeis: ['Distribuidora'] }

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={[ROUTES.dashboard]}>
      <Routes>
        <Route
          path={ROUTES.dashboard}
          element={
            <RequireSessaoLiberada>
              <div>conteúdo</div>
            </RequireSessaoLiberada>
          }
        />
        <Route path={ROUTES.login} element={<div>tela de login</div>} />
        <Route path={ROUTES.trocarSenha} element={<div>tela de troca</div>} />
      </Routes>
    </MemoryRouter>,
  )

// RF-45: com a troca de senha inicial pendente, nada do app monta antes da troca.
describe('RequireSessaoLiberada', () => {
  beforeEach(() => useSessionStore.setState({ token: null, usuario: null }))

  it('sem sessão manda pro login', () => {
    renderizar()
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('com troca pendente manda pra troca de senha', () => {
    useSessionStore.setState({ token: 't', usuario: { ...usuario, trocarSenha: true } })
    renderizar()
    expect(screen.getByText('tela de troca')).toBeInTheDocument()
  })

  it('sessão liberada mostra o conteúdo', () => {
    useSessionStore.setState({ token: 't', usuario })
    renderizar()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })
})
