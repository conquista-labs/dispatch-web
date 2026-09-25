import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'
import { useSessionStore, type Usuario } from '@/entities/usuario'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { ExcecaoCard } from './ExcecaoCard'

const excecao: ProtocoloResumo = {
  id: 'p1',
  numero: '263546',
  tipoAtoId: null,
  tipoAtoNomeOriginal: 'Escritura de doação',
  escreventeId: 'e1',
  etapa: 'PreConferencia',
  prioridade: 'Normal',
  status: 'Excecao',
  donoId: null,
  vencimentoEm: null,
  motivoExcecao: 'tipo desconhecido',
  observacao: null,
  semaforo: null,
  iniciadoEm: null,
  pausadoEm: null,
  concluidoEm: null,
  duracao: null,
  andamentoEm: '2026-09-25T09:00:00Z',
  numeroDaConferencia: 1,
}

const info: InfoProtocolo = { tipoAtoNome: null, escreventeNome: 'Ana Escrevente', equipeId: null, equipeNome: null }

const entrarComo = (papeis: Usuario['papeis']) =>
  useSessionStore.setState({ token: 't', usuario: { id: 'u', nome: 'X', email: 'x@c.com', papeis } })

const renderCard = (protocolo: ProtocoloResumo = excecao) =>
  renderWithProviders(<ExcecaoCard protocolo={protocolo} conferentes={[]} info={info} onAbrirDetalhe={() => {}} />)

// RF-17 no layout do protótipo v2: número + tipo + tag na 1ª linha, e uma frase que diz o que fazer.
describe('ExcecaoCard', () => {
  beforeEach(() => useSessionStore.setState({ token: null, usuario: null }))

  it('tipo desconhecido mostra o nome como veio, a tag "tipo novo" e a frase', () => {
    entrarComo(['Administrador'])
    renderCard()
    expect(screen.getByText('“Escritura de doação”')).toBeInTheDocument()
    expect(screen.getByText('tipo novo')).toBeInTheDocument()
    expect(screen.getByText(/ninguém tem alçada definida/)).toBeInTheDocument()
    expect(screen.getByText('sem equipe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeEnabled()
  })

  it('para a distribuidora, tipo novo vira "Pedir à administração" desabilitado', () => {
    entrarComo(['Distribuidora'])
    renderCard()
    expect(screen.getByRole('button', { name: 'Pedir à administração' })).toBeDisabled()
  })

  it('sem nome nenhum, diz que o tipo não foi informado', () => {
    entrarComo(['Distribuidora'])
    renderCard({ ...excecao, tipoAtoNomeOriginal: null, motivoExcecao: 'ninguém com alçada' })
    expect(screen.getByText('tipo de ato não informado')).toBeInTheDocument()
    expect(screen.getByText('sem alçada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeEnabled()
  })
})
