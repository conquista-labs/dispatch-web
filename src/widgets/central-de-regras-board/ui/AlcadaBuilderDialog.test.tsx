import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Conferente } from '@/entities/conferente'
import type { TipoAto } from '@/entities/tipoAto'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { useAlcadaBuilder } from '../model/use-alcada-builder'
import { AlcadaBuilderDialog } from './AlcadaBuilderDialog'

const criar = vi.fn().mockResolvedValue({ regraId: 'nova' })
vi.mock('@/features/regra-alcada/criar/api/criar-regra-alcada', () => ({
  criarRegraAlcada: (...args: unknown[]) => criar(...args),
}))

const conferentes = [{ id: 'c1', nome: 'Ana', nivel: 'Pleno', ativo: true, naEscala: true }] as Conferente[]
const tiposAto: TipoAto[] = [{ id: 't1', nome: 'Venda e Compra', ativo: true, grupo: null }]

// Monta o construtor com o hook de verdade — o que se testa é a moldura (frase ao vivo,
// passos, rodapé com o que falta), a lógica já tem teste próprio em use-alcada-builder.test.tsx.
const Construtor = () => {
  const builder = useAlcadaBuilder({
    conferentes,
    equipes: [],
    tiposAto,
    nomePorConferenteId: new Map([['c1', 'Ana']]),
    nomePorTipoAtoId: new Map([['t1', 'Venda e Compra']]),
    nomePorEquipeId: new Map(),
  })
  return (
    <>
      <button onClick={builder.abrir}>Nova regra</button>
      <AlcadaBuilderDialog builder={builder} conferentes={conferentes} />
    </>
  )
}

describe('AlcadaBuilderDialog', () => {
  it('mostra os 3 passos e segura "Criar regra" dizendo o que falta', async () => {
    renderWithProviders(<Construtor />)
    await userEvent.click(screen.getByRole('button', { name: 'Nova regra' }))

    expect(await screen.findByText('NOVA REGRA DE ALÇADA')).toBeInTheDocument()
    expect(screen.getByText('Quem')).toBeInTheDocument()
    expect(screen.getByText('Pode ou não pode')).toBeInTheDocument()
    expect(screen.getByText('O quê')).toBeInTheDocument()
    expect(screen.getByText('Falta escolher o quê.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar regra' })).toBeDisabled()
  })

  it('com o alvo escolhido, a frase fecha e "Criar regra" cria e fecha o modal', async () => {
    renderWithProviders(<Construtor />)
    await userEvent.click(screen.getByRole('button', { name: 'Nova regra' }))

    await userEvent.click(await screen.findByRole('button', { name: 'conferir todos os atos' }))
    expect(screen.getByRole('heading', { name: /pode conferir todos os atos$/ })).toBeInTheDocument()
    expect(screen.getByText(/^Pronto/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Criar regra' }))
    expect(criar.mock.calls[0][0]).toEqual(expect.objectContaining({ alvoTodosOsAtos: true, permissao: 'Permite' }))
    await waitFor(() => expect(screen.queryByText('NOVA REGRA DE ALÇADA')).not.toBeInTheDocument())
  })
})
