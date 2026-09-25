import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Configuracao } from '@/entities/configuracao'
import type { Equipe } from '@/entities/equipe'
import type { RegraAlcada } from '@/entities/regraAlcada'
import type { TipoAto } from '@/entities/tipoAto'
import { useSessionStore, type Usuario } from '@/entities/usuario'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { AbaRegrasEmVigor } from './AbaRegrasEmVigor'

const regra = (id: string, conferente: string): RegraAlcada => ({
  id,
  sujeitoNivel: null,
  sujeitoConferenteId: conferente,
  permissao: 'Nega',
  alvoEtapa: 'PreConferencia',
  alvoTipoAtoId: null,
  alvoEhEquipe: false,
  alvoEquipeId: null,
  alvoTodosOsAtos: false,
  alvoGrupo: null,
  alvoEhEquipeEEtapa: false,
  origem: 'Manual',
  ativa: true,
  usos: 1,
  regraBase: false,
})

const conferentes = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((id, i) => ({ id, nome: `Pessoa ${i + 1}` }))

const configuracao = {
  faixaAtencaoMinutos: 240,
  faixaUrgenteMinutos: 60,
  limiteDeAtosSimultaneos: 1,
  janelaDeCorrecaoMinutos: 15,
  diasDeMemoriaDescarte: 30,
  tempoMedioPorAtoMinutos: 20,
} as Configuracao

vi.mock('@/entities/regraAlcada/api/get-regras-alcada', () => ({
  getRegrasAlcada: () => Promise.resolve(conferentes.map((c, i) => regra(`r${i}`, c.id))),
}))
vi.mock('@/entities/conferente/api/get-conferentes', () => ({ getConferentes: () => Promise.resolve(conferentes) }))
vi.mock('@/entities/tipoAto/api/get-tipos-ato', () => ({
  getTiposAto: (): Promise<TipoAto[]> => Promise.resolve([{ id: 't1', nome: 'Inventário', ativo: true } as TipoAto]),
}))
vi.mock('@/entities/equipe/api/get-equipes', () => ({ getEquipes: (): Promise<Equipe[]> => Promise.resolve([]) }))
vi.mock('@/entities/escrevente/api/get-escreventes', () => ({ getEscreventes: () => Promise.resolve([]) }))
vi.mock('@/entities/configuracao/api/get-configuracao', () => ({
  getConfiguracao: () => Promise.resolve(configuracao),
}))

const entrarComo = (papeis: Usuario['papeis']) =>
  useSessionStore.setState({ token: 't', usuario: { id: 'u', nome: 'X', email: 'x@c.com', papeis } })

// Protótipo v2: cada bloco mostra 4 linhas e "ver as outras N"; Operação não corta; contagens com
// unidade; o cabeçalho da aba só aparece pro admin.
describe('AbaRegrasEmVigor', () => {
  beforeEach(() => useSessionStore.setState({ token: null, usuario: null }))

  it('corta a Alçada em 4 linhas e abre o resto em "ver as outras N"', async () => {
    entrarComo(['Administrador'])
    renderWithProviders(<AbaRegrasEmVigor onIrParaAlcada={() => {}} />)

    expect(await screen.findByRole('heading', { name: 'Tudo o que o sistema aplica hoje' })).toBeInTheDocument()
    expect(screen.getByText('6 pessoas e níveis · 6 regras')).toBeInTheDocument()
    expect(screen.queryByText(/^Pessoa 5:/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'ver as outras 2' }))
    expect(screen.getByText(/^Pessoa 5:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'mostrar menos' })).toBeInTheDocument()
  })

  it('a busca mostra tudo o que bate, sem cortar', async () => {
    entrarComo(['Administrador'])
    renderWithProviders(<AbaRegrasEmVigor />)

    await userEvent.type(await screen.findByPlaceholderText(/buscar por nível/), 'Pessoa')
    expect(screen.getByText('6 de 6')).toBeInTheDocument()
    expect(screen.getByText(/^Pessoa 6:/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver as outras/ })).not.toBeInTheDocument()
  })

  it('Operação mostra os 6 parâmetros com hora legível; a distribuidora não vê o cabeçalho da aba', async () => {
    entrarComo(['Distribuidora'])
    renderWithProviders(<AbaRegrasEmVigor />)

    expect(await screen.findByText('6 parâmetros')).toBeInTheDocument()
    expect(screen.getByText('1 tipo de ato')).toBeInTheDocument()
    expect(screen.getByText('Semáforo: amarelo abaixo de 4h, laranja abaixo de 1h')).toBeInTheDocument()
    expect(screen.getByText('iniciar outro exige concluir o atual')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tudo o que o sistema aplica hoje' })).not.toBeInTheDocument()
    expect(screen.getAllByText('só a administração edita')).toHaveLength(4)
  })
})
