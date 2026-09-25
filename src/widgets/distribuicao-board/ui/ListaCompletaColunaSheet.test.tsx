import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'
import { TooltipProvider } from '@/shared/ui/tooltip'

import { ListaCompletaColunaSheet } from './ListaCompletaColunaSheet'

const agora = Date.parse('2026-09-25T12:00:00Z')

const base: ProtocoloResumo = {
  id: 'p1',
  numero: '263546',
  tipoAtoId: 't1',
  escreventeId: 'e1',
  etapa: 'PosConferencia',
  prioridade: 'Normal',
  status: 'Atribuido',
  donoId: 'c1',
  vencimentoEm: '2026-09-26T12:00:00Z',
  motivoExcecao: null,
  observacao: null,
  semaforo: 'Verde',
  iniciadoEm: null,
  pausadoEm: null,
  concluidoEm: null,
  duracao: null,
  andamentoEm: '2026-09-25T09:00:00Z',
  numeroDaConferencia: 1,
}

const info: InfoProtocolo = {
  tipoAtoNome: 'Inventário',
  escreventeNome: 'Ana Escrevente',
  equipeId: 'q1',
  equipeNome: '5º andar',
}

const renderLista = (protocolos: ProtocoloResumo[], props: { onFechar?: () => void; onAbrir?: () => void } = {}) =>
  renderWithProviders(
    <TooltipProvider>
      <ListaCompletaColunaSheet
        aberto
        onFechar={props.onFechar ?? vi.fn()}
        titulo="Marcio Santos · 7 na mão"
        subtitulo="atribuídos e em conferência, ordenados por vencimento. Clique para ver o detalhe."
        protocolos={protocolos}
        resolverInfo={() => info}
        now={agora}
        onAbrirDetalhe={props.onAbrir ?? vi.fn()}
      />
    </TooltipProvider>,
  )

// RF-18c no layout do protótipo v2: título + subtítulo que diz a ordem, "Fechar" em texto, uma linha
// compacta por protocolo, do vencimento mais próximo pro mais distante.
describe('ListaCompletaColunaSheet', () => {
  it('mostra título, subtítulo e as linhas ordenadas por vencimento', () => {
    renderLista([
      { ...base, id: 'tarde', numero: '111111', vencimentoEm: '2026-09-27T12:00:00Z' },
      { ...base, id: 'sem', numero: '333333', vencimentoEm: null },
      { ...base, id: 'cedo', numero: '222222', vencimentoEm: '2026-09-25T15:00:00Z', status: 'Conferindo' },
    ])

    const painel = screen.getByRole('dialog', { name: 'Marcio Santos · 7 na mão' })
    expect(within(painel).getByText(/ordenados por vencimento/)).toBeInTheDocument()
    const numeros = within(painel)
      .getAllByText(/^\d{6}$/)
      .map((n) => n.textContent)
    expect(numeros).toEqual(['222222', '111111', '333333'])
    expect(within(painel).getByText('em conferência')).toBeInTheDocument()
  })

  it('"Fechar" fecha e clicar na linha abre o detalhe sem fechar a lista', async () => {
    const onFechar = vi.fn()
    const onAbrir = vi.fn()
    renderLista([base], { onFechar, onAbrir })

    await userEvent.click(screen.getByText('263546'))
    expect(onAbrir).toHaveBeenCalledWith('p1')
    expect(onFechar).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onFechar).toHaveBeenCalled()
  })

  it('sem nome no catálogo, usa o nome do tipo como veio no relatório', () => {
    renderWithProviders(
      <TooltipProvider>
        <ListaCompletaColunaSheet
          aberto
          onFechar={vi.fn()}
          titulo="Pool aberto · 1 protocolos"
          subtitulo="sem dono"
          protocolos={[{ ...base, tipoAtoId: null, tipoAtoNomeOriginal: 'Escritura de doação', donoId: null }]}
          resolverInfo={() => ({ ...info, tipoAtoNome: null })}
          now={agora}
          onAbrirDetalhe={vi.fn()}
        />
      </TooltipProvider>,
    )
    expect(screen.getByText('Escritura de doação')).toBeInTheDocument()
  })
})
