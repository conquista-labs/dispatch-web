import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'
import { TooltipProvider } from '@/shared/ui/tooltip'

import { ProtocoloCard } from './ProtocoloCard'

const agora = Date.parse('2026-09-25T12:00:00Z')

const protocolo = (overrides: Partial<ProtocoloResumo> = {}): ProtocoloResumo => ({
  id: 'p1',
  numero: '263546',
  tipoAtoId: 't1',
  escreventeId: 'e1',
  etapa: 'PosConferencia',
  prioridade: 'Normal',
  status: 'Pool',
  donoId: null,
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
  ...overrides,
})

const info: InfoProtocolo = {
  tipoAtoNome: 'Inventário',
  escreventeNome: 'Ana Escrevente',
  equipeId: 'q1',
  equipeNome: '5º andar',
}

const renderCard = (p: ProtocoloResumo) =>
  renderWithProviders(
    <TooltipProvider>
      <ProtocoloCard protocolo={p} now={agora} info={info} somenteLeitura />
    </TooltipProvider>,
  )

// As duas pílulas da linha de meta: "Alta" (prioridade, vermelha) e a tag de rodada (RF-24k,
// neutra). A 1ª conferência sem prioridade alta não mostra nenhuma das duas.
describe('ProtocoloCard — pílulas de prioridade e rodada', () => {
  it('protocolo comum, na primeira conferência, não tem pílula', () => {
    renderCard(protocolo())
    expect(screen.queryByText('Alta')).not.toBeInTheDocument()
    expect(screen.queryByText(/↻/)).not.toBeInTheDocument()
  })

  it('protocolo que voltou com prioridade alta mostra as duas', () => {
    renderCard(protocolo({ prioridade: 'Alta', numeroDaConferencia: 2 }))
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('↻ 2ª conferência')).toBeInTheDocument()
  })
})
