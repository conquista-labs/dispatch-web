import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AltaPendente, OndeAlta } from '../lib/prioridade-alta'
import { protocoloDeTeste } from '../lib/test/protocolo-de-teste'
import { AvisoPrioridadeAlta } from './AvisoPrioridadeAlta'

const alta = (numero: string, onde: OndeAlta): AltaPendente => ({
  protocolo: protocoloDeTeste(numero, { prioridade: 'Alta' }),
  onde,
})

const renderFaixa = (altas: AltaPendente[]) => {
  const onVer = vi.fn()
  const onVerTodos = vi.fn()
  render(<AvisoPrioridadeAlta altas={altas} onVer={onVer} onVerTodos={onVerTodos} />)
  return { onVer, onVerTodos }
}

describe('AvisoPrioridadeAlta (RF-24h)', () => {
  it('sem nenhum alto, não renderiza nada', () => {
    const { container } = render(<AvisoPrioridadeAlta altas={[]} onVer={vi.fn()} onVerTodos={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('1 no pool: título no singular e um botão que leva até ele', async () => {
    const { onVer } = renderFaixa([alta('263546', 'pool')])
    expect(screen.getByRole('status')).toHaveTextContent('1 protocolo com prioridade alta')
    expect(screen.getByText('1 no pool')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '263546 · pool →' }))
    expect(onVer).toHaveBeenCalledWith('263546')
  })

  it('1 no pool + 1 seu: diferencia os dois, em conferência conta como "seu"', () => {
    renderFaixa([alta('111', 'conf'), alta('222', 'pool')])
    expect(screen.getByText('1 atribuído a você · 1 no pool')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '111 · em conferência →' })).toBeInTheDocument()
  })

  it('até 3: um botão por protocolo, sem "Ver os N"', () => {
    renderFaixa([alta('1', 'minhas'), alta('2', 'pool'), alta('3', 'pool')])
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /Ver os/ })).not.toBeInTheDocument()
  })

  it('4 ou mais: os 2 primeiros + "Ver os N", que abre a lista', async () => {
    const { onVerTodos } = renderFaixa([alta('1', 'minhas'), alta('2', 'minhas'), alta('3', 'pool'), alta('4', 'pool')])
    expect(screen.getByRole('button', { name: '1 · seu →' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2 · seu →' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^3 ·/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ver os 4' }))
    expect(onVerTodos).toHaveBeenCalled()
  })
})
