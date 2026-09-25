import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { HistoricoConferencia } from '@/entities/protocolo'

import { HistoricoConferencias } from './PainelDetalheProtocolo'

const linha = (overrides: Partial<HistoricoConferencia> = {}): HistoricoConferencia => ({
  protocoloId: 'antiga',
  andamentoEm: '2026-09-20T10:00:00Z',
  status: 'Reprovado',
  donoId: 'c1',
  concluidoEm: '2026-09-20T11:00:00Z',
  numeroDaConferencia: 1,
  observacao: 'falta certidão de ônus atualizada',
  ...overrides,
})

const renderHistorico = (historico: HistoricoConferencia[]) =>
  render(<HistoricoConferencias historico={historico} nomePorConferenteId={new Map([['c1', 'Ana Conferente']])} />)

// RF-24k: cada linha diz qual rodada foi e, se foi reprovada, o motivo — a observação da própria
// linha (decisão do dono). A condição é "reprovada E com observação"; os dois outros casos não
// podem mostrar um "—" solto nem expor observação de linha aprovada como motivo.
describe('HistoricoConferencias — rodada e motivo da não aprovação', () => {
  it('linha reprovada com observação mostra a rodada e o motivo', () => {
    renderHistorico([linha()])
    expect(screen.getByText('1ª conferência — falta certidão de ônus atualizada')).toBeInTheDocument()
  })

  it('linha aprovada não mostra a observação como motivo', () => {
    renderHistorico([linha({ status: 'Aprovado', numeroDaConferencia: 2 })])
    expect(screen.getByText('2ª conferência')).toBeInTheDocument()
    expect(screen.queryByText(/falta certidão/)).not.toBeInTheDocument()
  })

  it('linha reprovada sem observação mostra só a rodada, sem "—" solto', () => {
    renderHistorico([linha({ observacao: null })])
    expect(screen.getByText('1ª conferência')).toBeInTheDocument()
  })
})
