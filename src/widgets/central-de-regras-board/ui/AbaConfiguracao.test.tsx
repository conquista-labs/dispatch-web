import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Configuracao } from '@/entities/configuracao'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { AbaConfiguracao } from './AbaConfiguracao'

const configuracao: Configuracao = {
  faixaAtencaoMinutos: 240,
  faixaUrgenteMinutos: 60,
  limiteDeAtosSimultaneos: 1,
  janelaDeCorrecaoMinutos: 15,
  diasDeMemoriaDescarte: 30,
  tempoMedioPorAtoMinutos: 18,
  limiarTipoDesconhecido: 5,
  limiarPrazoIrrealCasos: 8,
  limiarPrazoIrrealEstouro: 0.6,
  limiarEscreventeOrfao: 3,
  limiarRiscoQualidadeCasos: 5,
  limiarRiscoQualidadeReprovacao: 0.3,
}

const salvar = vi.fn().mockResolvedValue(undefined)
let respostaDoBack: Configuracao = configuracao
vi.mock('@/entities/configuracao/api/get-configuracao', () => ({
  getConfiguracao: () => Promise.resolve(respostaDoBack),
}))
vi.mock('@/features/configuracao/atualizar/api/atualizar-configuracao', () => ({
  atualizarConfiguracao: (...args: unknown[]) => salvar(...args),
}))

// Controle unificado do protótipo v2 ("− 4 h + | − 0 min +"): cada segmento tem rótulo acessível
// próprio, e mexer num campo libera o "Salvar configuração".
describe('AbaConfiguracao', () => {
  it('mexer nas horas da faixa de atenção soma 60 min e libera o salvar', async () => {
    renderWithProviders(<AbaConfiguracao />)

    expect(await screen.findByRole('button', { name: 'Nada alterado' })).toBeDisabled()
    expect(screen.getByLabelText('horas — Faixa de atenção')).toHaveValue('4')

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar horas — Faixa de atenção' }))
    expect(screen.getByLabelText('horas — Faixa de atenção')).toHaveValue('5')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))
    expect(salvar.mock.calls[0][0]).toEqual(expect.objectContaining({ faixaAtencaoMinutos: 300 }))
  })

  // Regra do pool (2026-09-26): campos novos só aparecem quando a API manda.
  it('sem os campos da regra do pool, eles não aparecem', async () => {
    respostaDoBack = configuracao
    renderWithProviders(<AbaConfiguracao />)

    expect(await screen.findByText('Atos simultâneos por conferente')).toBeInTheDocument()
    expect(screen.queryByText('Pool em ordem obrigatória')).not.toBeInTheDocument()
  })

  it('desligar a ordem obrigatória e mexer no limite vão juntos no salvar', async () => {
    salvar.mockClear()
    respostaDoBack = { ...configuracao, limiteDeAtosNaMao: 5, poolEmOrdemObrigatoria: true }
    renderWithProviders(<AbaConfiguracao />)

    await userEvent.click(await screen.findByRole('switch', { name: 'Pool em ordem obrigatória' }))
    await userEvent.click(screen.getByRole('button', { name: 'Diminuir Atos na mão por conferente' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(salvar.mock.calls[0][0]).toEqual(
      expect.objectContaining({ poolEmOrdemObrigatoria: false, limiteDeAtosNaMao: 4 }),
    )
  })
})
