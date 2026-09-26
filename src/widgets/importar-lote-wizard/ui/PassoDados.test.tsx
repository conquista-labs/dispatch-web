import { screen, waitFor } from '@testing-library/react'
import { AxiosError } from 'axios'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RelatorioConvertido } from '@/features/protocolo/converter-relatorio'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { PassoDados } from './PassoDados'

// Um vi.fn() novo por teste (mockReset no beforeEach quebra o teste de rejeição — docs/patterns/testing-strategy.md).
let converter = vi.fn()
vi.mock('@/features/protocolo/converter-relatorio/api/converter-relatorio', () => ({
  converterRelatorio: (arquivo: File) => converter(arquivo),
}))

const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const daquiAPouco = new Date(Date.now() + 60 * 60 * 1000).toISOString()

const relatorio: RelatorioConvertido = {
  conector: 'Relatório de Andamentos dos Protocolos',
  etapa: 'PosConferencia',
  totalDeclarado: 2,
  totalLido: 2,
  linhas: [
    { protocolo: '100001', tipoAto: 'VENDA E COMPRA', escrevente: 'ANA', dataHoraAndamento: ontem },
    { protocolo: '100002', tipoAto: 'INVENTÁRIO', escrevente: 'BRUNO', dataHoraAndamento: daquiAPouco },
  ],
}

const arquivo = () => new File(['x'], '20h27min.xls', { type: 'application/vnd.ms-excel' })

// RF-05 com o conector do cartório: o .xls vai pro back, que devolve as linhas no formato da
// importação e a etapa declarada no relatório — a etapa trava, e o aviso diz quantas linhas a linha
// de corte vai ignorar antes mesmo de ler.
describe('PassoDados — relatório .xls do cartório', () => {
  beforeEach(() => {
    converter = vi.fn()
  })

  it('lê o arquivo, trava a etapa do relatório e manda as linhas convertidas', async () => {
    converter.mockResolvedValue(relatorio)
    const onContinuar = vi.fn()
    renderWithProviders(<PassoDados onContinuar={onContinuar} carregando={false} erro={null} />)

    await userEvent.upload(screen.getByLabelText('Arquivo do relatório (.xls)'), arquivo())

    expect(await screen.findByText('20h27min.xls')).toBeInTheDocument()
    expect(screen.getByText('lida do relatório enviado')).toBeInTheDocument()
    expect(screen.getByText('Pós-conferência')).toBeInTheDocument()
    expect(screen.getByText(/1 antes da linha de corte/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ler 2 linhas' }))
    expect(onContinuar).toHaveBeenCalledWith(
      expect.objectContaining({ etapa: 'PosConferencia', linhas: relatorio.linhas }),
    )
  })

  it('mostra o motivo que o conector devolve quando não reconhece o arquivo', async () => {
    const resposta = { status: 400, data: { codigo: 'totais-nao-conferem', motivo: 'Os totais não conferem.' } }
    converter.mockRejectedValue(new AxiosError('Bad Request', '400', undefined, undefined, resposta as never))
    renderWithProviders(<PassoDados onContinuar={vi.fn()} carregando={false} erro={null} />)

    await userEvent.upload(screen.getByLabelText('Arquivo do relatório (.xls)'), arquivo())
    await waitFor(() => expect(screen.getByText('Os totais não conferem.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Ler linhas' })).toBeDisabled()
  })

  it('"Trocar arquivo" volta pra escolha e destrava a etapa', async () => {
    converter.mockResolvedValue(relatorio)
    renderWithProviders(<PassoDados onContinuar={vi.fn()} carregando={false} erro={null} />)

    await userEvent.upload(screen.getByLabelText('Arquivo do relatório (.xls)'), arquivo())
    await userEvent.click(await screen.findByRole('button', { name: 'Trocar arquivo' }))
    expect(screen.getByText('o lote inteiro é pré ou pós — nunca misturado')).toBeInTheDocument()
    expect(screen.getByLabelText('Linhas do relatório em CSV')).toBeInTheDocument()
  })
})
