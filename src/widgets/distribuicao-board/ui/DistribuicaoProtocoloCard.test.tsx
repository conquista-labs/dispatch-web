import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'
import { TooltipProvider } from '@/shared/ui/tooltip'

import { DistribuicaoProtocoloCard } from './DistribuicaoProtocoloCard'

const agora = Date.parse('2026-09-25T12:00:00Z')

const protocolo: ProtocoloResumo = {
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
  numeroDaConferencia: 2,
}

const info: InfoProtocolo = {
  tipoAtoNome: 'Inventário',
  escreventeNome: 'Ana Escrevente',
  equipeId: 'q1',
  equipeNome: '5º andar',
}

const renderCard = (variant: 'conferente' | 'status') =>
  renderWithProviders(
    <TooltipProvider>
      <DistribuicaoProtocoloCard protocolo={protocolo} now={agora} info={info} variant={variant} />
    </TooltipProvider>,
  )

// RF-24k: o mesmo card serve às abas Por conferente e Por status, mas a tag de rodada só existe na
// primeira (a coluna estreita, versão curta "↻ 2ª") — o protótipo não a mostra em Por status.
describe('DistribuicaoProtocoloCard — tag de rodada por aba', () => {
  it('em Por conferente mostra a versão curta, com o texto completo no title', () => {
    renderCard('conferente')
    expect(screen.getByText('↻ 2ª')).toHaveAttribute('title', '2ª conferência — voltou depois de não aprovado')
  })

  it('em Por status não mostra a tag', () => {
    renderCard('status')
    expect(screen.queryByText(/↻/)).not.toBeInTheDocument()
  })
})
