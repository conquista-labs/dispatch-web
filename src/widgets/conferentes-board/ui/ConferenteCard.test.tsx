import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Conferente } from '@/entities/conferente'
import { type Papel, useSessionStore } from '@/entities/usuario'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { ConferenteCard } from './ConferenteCard'

const conferente = (sobrescreve: Partial<Conferente> = {}): Conferente => ({
  id: 'c-1',
  nome: 'Ana Souza',
  email: 'ana@cartorio.com',
  ativo: true,
  nivel: 'Pleno',
  jornadaHoras: 8,
  naEscala: true,
  cargaAtual: 3,
  capacidadeEstimada: 26,
  ...sobrescreve,
})

const logarComo = (papeis: Papel[]) =>
  useSessionStore.setState({ token: 't', usuario: { id: 'u', nome: 'Quem vê', email: 'q@cartorio.com', papeis } })

const renderizar = (c: Conferente) =>
  renderWithProviders(<ConferenteCard conferente={c} tiposAlcancados={5} totalTipos={9} frasesDeAlcada={[]} />)

describe('ConferenteCard', () => {
  beforeEach(() => useSessionStore.setState({ token: null, usuario: null }))

  it('pro admin: cargo, jornada editável, remover e o selo "só administração"', () => {
    logarComo(['Administrador', 'Distribuidora'])
    renderizar(conferente())

    expect(screen.getByRole('button', { name: 'Analista Pleno' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aumentar jornada' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument()
    expect(screen.getByText('SÓ ADMINISTRAÇÃO')).toBeInTheDocument()
  })

  // RF-29a: pra distribuidora a tela é só presença — o back nem manda o nível.
  it('pra distribuidora: só presença, jornada em texto, sem cargo nem remover', () => {
    logarComo(['Distribuidora'])
    renderizar(conferente({ nivel: null }))

    expect(screen.getByText('Jornada 8h')).toBeInTheDocument()
    expect(screen.getByText('pode conferir 5 de 9 tipos de ato')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Na escala' })).toBeInTheDocument()
    expect(screen.queryByText(/Analista/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aumentar jornada' })).not.toBeInTheDocument()
    expect(screen.queryByText('SÓ ADMINISTRAÇÃO')).not.toBeInTheDocument()
  })
})
