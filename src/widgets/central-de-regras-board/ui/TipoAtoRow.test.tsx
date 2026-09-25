import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TipoAtoComUso } from '@/entities/tipoAto'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { TipoAtoRow } from './TipoAtoRow'

const api = { renomear: vi.fn(), peso: vi.fn() }
vi.mock('@/features/tipoAto/renomear/api/renomear-tipo-ato', () => ({
  renomearTipoAto: (...args: unknown[]) => api.renomear(...args),
}))
vi.mock('@/features/tipoAto/definir-peso/api/definir-peso-tipo-ato', () => ({
  definirPesoTipoAto: (...args: unknown[]) => api.peso(...args),
}))

const tipo: TipoAtoComUso = {
  id: 't1',
  nome: 'Cessão de Direitos Decorrentes da Legitimação de Posse',
  ativo: true,
  pesoComplexidade: 1,
  grupo: null,
  tempoReferencia: {
    minutos: 18,
    origem: 'Historico',
    informadoMinutos: null,
    medianaMinutos: 18,
    conferenciasNoHistorico: 42,
  },
  volume: 3,
  conferentesComAlcada: 0,
}

// Linha da tabela de Tipos (protótipo v2): o nome inteiro num botão que vira campo ao clicar (o
// <input> fixo cortava nomes longos), histórico, peso com "×" e o alerta de tipo sem alçada.
describe('TipoAtoRow', () => {
  beforeEach(() => {
    api.renomear = vi.fn().mockResolvedValue(undefined)
    api.peso = vi.fn().mockResolvedValue(undefined)
  })

  it('mostra o nome inteiro, o histórico e avisa quando ninguém tem alçada', () => {
    renderWithProviders(<TipoAtoRow tipo={tipo} />)
    expect(screen.getByRole('button', { name: tipo.nome })).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('ninguém com alçada')).toBeInTheDocument()
    expect(screen.getByText('mediana de 42 atos')).toBeInTheDocument()
  })

  it('clicar no nome abre o campo; Esc desfaz sem salvar e Enter salva o novo nome', async () => {
    renderWithProviders(<TipoAtoRow tipo={tipo} />)

    await userEvent.click(screen.getByRole('button', { name: tipo.nome }))
    await userEvent.type(screen.getByLabelText('Nome do tipo de ato'), ' X{Escape}')
    expect(api.renomear).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: tipo.nome })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: tipo.nome }))
    const campo = screen.getByLabelText('Nome do tipo de ato')
    await userEvent.clear(campo)
    await userEvent.type(campo, 'Cessão de Posse{Enter}')
    expect(api.renomear.mock.calls[0][0]).toEqual({ tipoAtoId: 't1', nome: 'Cessão de Posse' })
  })

  it('o stepper de peso sobe de 0,05 em 0,05', async () => {
    renderWithProviders(<TipoAtoRow tipo={tipo} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar peso' }))
    expect(api.peso.mock.calls[0][0]).toEqual({ tipoAtoId: 't1', peso: 1.05 })
  })
})
