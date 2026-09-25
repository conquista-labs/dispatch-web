import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ImportarLoteRequest, ResumoImportacao } from '@/features/protocolo/importar-lote'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { ImportarLoteWizard } from './ImportarLoteWizard'

// A prévia do back devolve uma linha por linha enviada, na mesma ordem — o mock repete isso.
const ecoar = (request: ImportarLoteRequest): ResumoImportacao => ({
  loteImportacaoId: null,
  totalNoArquivo: request.linhas.length,
  ignoradasPelaLinhaDeCorte: 0,
  processadas: request.linhas.length,
  atribuidosPorConferente: [],
  enviadosParaPool: request.linhas.length,
  excecoes: 0,
  tiposDesconhecidos: [],
  escreventesSemEquipe: [],
  linhas: request.linhas.map((l) => ({
    protocolo: l.protocolo,
    tipoAto: l.tipoAto,
    tipoConhecido: true,
    escrevente: l.escrevente,
    equipe: 'Quinto Andar',
    prazo: 'D1',
    vencimentoEm: null,
    semaforo: null,
    jaExiste: false,
    comAlcada: 3,
  })),
})

const preVisualizar = vi.fn((request: ImportarLoteRequest) => Promise.resolve(ecoar(request)))
vi.mock('@/features/protocolo/importar-lote/api/importar-lote', () => ({
  preVisualizarLote: (request: ImportarLoteRequest) => preVisualizar(request),
  confirmarLote: vi.fn(),
}))

const RELATORIO = [
  'protocolo,tipoAto,escrevente,dataHoraAndamento',
  '100001,Inventário,Ana,2030-01-01 10:00:00',
  '100002,Venda e Compra,Bruno,2030-01-01 10:05:00',
  '100003,Procuração,Carla,2030-01-01 10:10:00',
].join('\n')

const protocolosEnviados = (chamada: number) =>
  (preVisualizar.mock.calls[chamada][0] as ImportarLoteRequest).linhas.map((l) => l.protocolo)

// RF-10a: no passo 2 cada linha sai do lote pelo "×" — a prévia é refeita no back sem ela (nada é
// gravado), e "Desfazer" devolve o lote como veio do relatório.
describe('ImportarLoteWizard — excluir linha do lote (RF-10a)', () => {
  it('exclui a linha, refaz a prévia sem ela e desfaz', async () => {
    renderWithProviders(<ImportarLoteWizard />)

    fireEvent.change(screen.getByPlaceholderText(/protocolo,tipoAto/), { target: { value: RELATORIO } })
    await userEvent.click(screen.getByRole('button', { name: 'Ler 3 linhas' }))
    expect(await screen.findByText('100002')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Excluir o protocolo 100002 do lote' }))
    await waitFor(() => expect(screen.queryByText('100002')).not.toBeInTheDocument())
    expect(protocolosEnviados(1)).toEqual(['100001', '100003'])
    expect(screen.getByText('1 linha excluída deste lote')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByText('100002')).toBeInTheDocument()
    expect(protocolosEnviados(2)).toEqual(['100001', '100002', '100003'])
    expect(screen.queryByText(/excluída deste lote/)).not.toBeInTheDocument()
  })

  it('com busca ativa, exclui a linha certa (índice no lote, não na lista filtrada)', async () => {
    preVisualizar.mockClear()
    renderWithProviders(<ImportarLoteWizard />)
    const muitas = [
      RELATORIO,
      ...Array.from({ length: 8 }, (_, i) => `2000${i},Tipo ${i},Pessoa ${i},2030-01-01 11:00:00`),
    ]
    fireEvent.change(screen.getByPlaceholderText(/protocolo,tipoAto/), { target: { value: muitas.join('\n') } })
    await userEvent.click(screen.getByRole('button', { name: 'Ler 11 linhas' }))

    await userEvent.type(await screen.findByPlaceholderText(/buscar protocolo/), 'Carla')
    await userEvent.click(screen.getByRole('button', { name: 'Excluir o protocolo 100003 do lote' }))
    await waitFor(() => expect(preVisualizar).toHaveBeenCalledTimes(2))
    expect(protocolosEnviados(1)).not.toContain('100003')
    expect(protocolosEnviados(1)).toHaveLength(10)
  })
})
