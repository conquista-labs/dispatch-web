import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SeletorMultiplo } from './SeletorMultiplo'

const opcoes = [
  { valor: 'a', label: 'Venda e Compra' },
  { valor: 'b', label: 'Doação' },
  { valor: 'c', label: 'Inventário' },
]

// RF-32: dropdown de seleção múltipla com busca — padronizou o alvo do construtor de regra
// (antes uma parede de até 24 pills). O texto do gatilho (0/1/N selecionados) é a lógica com
// mais risco de regressão silenciosa aqui.
describe('SeletorMultiplo', () => {
  it('gatilho mostra "Escolher o que…" sem nenhuma seleção', () => {
    render(<SeletorMultiplo selecionados={[]} opcoes={opcoes} onAlternar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Escolher o que…/ })).toBeInTheDocument()
  })

  it('gatilho mostra o label da opção quando só 1 está selecionada', () => {
    render(<SeletorMultiplo selecionados={['b']} opcoes={opcoes} onAlternar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Doação/ })).toBeInTheDocument()
  })

  it('gatilho mostra "N selecionados" quando mais de 1 está selecionada', () => {
    render(<SeletorMultiplo selecionados={['a', 'b']} opcoes={opcoes} onAlternar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /2 selecionados/ })).toBeInTheDocument()
  })

  it('busca filtra por label, sem diferenciar caixa', async () => {
    const user = userEvent.setup()
    render(<SeletorMultiplo selecionados={[]} opcoes={opcoes} onAlternar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Escolher o que…/ }))
    await user.type(screen.getByPlaceholderText('buscar…'), 'inv')

    expect(screen.getByText('Inventário')).toBeInTheDocument()
    expect(screen.queryByText('Doação')).not.toBeInTheDocument()
  })

  it('clicar numa opção chama onAlternar com o valor — não fecha o popover (multi-seleção)', async () => {
    const onAlternar = vi.fn()
    const user = userEvent.setup()
    render(<SeletorMultiplo selecionados={['a']} opcoes={opcoes} onAlternar={onAlternar} />)

    await user.click(screen.getByRole('button', { name: /Venda e Compra/ }))
    await user.click(screen.getByText('Doação'))

    expect(onAlternar).toHaveBeenCalledWith('b')
    // Continua aberto — o popover próprio (não onOpenChange) não fecha ao alternar.
    expect(screen.getByPlaceholderText('buscar…')).toBeInTheDocument()
  })
})
