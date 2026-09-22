import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SeletorUnico } from './seletor-unico'

const opcoes = [
  { valor: 'a', label: 'Venda e Compra' },
  { valor: 'b', label: 'Doação', sub: 'Notariais' },
]

// Dropdown de seleção única com busca — reaproveitado em todo lugar que escolhe conferente/
// tipo/equipe (RNF-11). Cobre filtro (case-insensitive), seleção fechando o popover, e o
// caminho de "valor livre" (RF-18f/RF-09: escrevente que ainda não existe no cadastro).
describe('SeletorUnico', () => {
  it('mostra "Escolher…" quando nada foi selecionado, e o label quando valor bate uma opção', () => {
    const { rerender } = render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Escolher…/ })).toBeInTheDocument()

    rerender(<SeletorUnico valor="a" opcoes={opcoes} onSelecionar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Venda e Compra/ })).toBeInTheDocument()
  })

  it('busca filtra por label, sem diferenciar maiúscula/minúscula', async () => {
    const user = userEvent.setup()
    render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Escolher…/ }))
    await user.type(screen.getByPlaceholderText('buscar…'), 'DOA')

    expect(screen.getByText('Doação')).toBeInTheDocument()
    expect(screen.queryByText('Venda e Compra')).not.toBeInTheDocument()
    expect(screen.getByText('1 opções')).toBeInTheDocument()
  })

  it('selecionar uma opção chama onSelecionar com o valor certo e limpa a busca', async () => {
    const onSelecionar = vi.fn()
    const user = userEvent.setup()
    render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={onSelecionar} />)

    await user.click(screen.getByRole('button', { name: /Escolher…/ }))
    await user.click(screen.getByText('Doação'))

    expect(onSelecionar).toHaveBeenCalledWith('b')
  })

  it('busca sem nenhuma opção correspondente mostra "Nada encontrado"', async () => {
    const user = userEvent.setup()
    render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Escolher…/ }))
    await user.type(screen.getByPlaceholderText('buscar…'), 'zzz')

    expect(screen.getByText('Nada encontrado.')).toBeInTheDocument()
  })

  it('sem permiteValorLivre, busca sem match não oferece "usar «busca»"', async () => {
    const user = userEvent.setup()
    render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Escolher…/ }))
    await user.type(screen.getByPlaceholderText('buscar…'), 'Novo Escrevente')

    expect(screen.queryByText(/usar/)).not.toBeInTheDocument()
  })

  it('com permiteValorLivre, busca sem match oferece "usar «busca»" e seleciona o texto digitado', async () => {
    const onSelecionar = vi.fn()
    const user = userEvent.setup()
    render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={onSelecionar} permiteValorLivre />)

    await user.click(screen.getByRole('button', { name: /Escolher…/ }))
    await user.type(screen.getByPlaceholderText('buscar…'), 'Novo Escrevente')
    await user.click(screen.getByText(/usar/))

    expect(onSelecionar).toHaveBeenCalledWith('Novo Escrevente')
  })

  it('com permiteValorLivre, busca que já bate uma opção existente NÃO oferece "usar «busca»" (evita duplicar)', async () => {
    const user = userEvent.setup()
    render(<SeletorUnico valor="" opcoes={opcoes} onSelecionar={vi.fn()} permiteValorLivre />)

    await user.click(screen.getByRole('button', { name: /Escolher…/ }))
    await user.type(screen.getByPlaceholderText('buscar…'), 'Doação')

    expect(screen.queryByText(/usar/)).not.toBeInTheDocument()
  })
})
