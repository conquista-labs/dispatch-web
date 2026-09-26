import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ResumoImportacao } from '@/features/protocolo/importar-lote'
import { renderWithProviders } from '@/shared/lib/test/render-with-providers'

import { PassoPrevia } from './PassoPrevia'

vi.mock('@/entities/conferente', async (original) => ({
  ...(await original<typeof import('@/entities/conferente')>()),
  useConferentes: () => ({ data: [] }),
}))

const linha = (escrevente: string, equipe: string | null, jaExiste = false) => ({
  protocolo: `P-${Math.random()}`,
  tipoAto: 'Inventario',
  tipoConhecido: false,
  escrevente,
  equipe,
  prazo: 'D1' as const,
  vencimentoEm: null,
  semaforo: null,
  jaExiste,
  comAlcada: 2,
})

const resumo = (extra: Partial<ResumoImportacao>): ResumoImportacao => ({
  loteImportacaoId: null,
  totalNoArquivo: 4,
  ignoradasPelaLinhaDeCorte: 1,
  processadas: 3,
  atribuidosPorConferente: [],
  enviadosParaPool: 3,
  excecoes: 0,
  tiposDesconhecidos: ['Inventário'],
  escreventesSemEquipe: ['Ana Souza'],
  linhas: [
    linha('ANA SOUZA', null),
    linha('Ana Souza', null),
    linha('Ana Souza', null, true),
    linha('Bruno', 'Térreo'),
  ],
  ...extra,
})

const renderizar = (r: ResumoImportacao) =>
  renderWithProviders(
    <PassoPrevia
      resumo={r}
      etapa="PosConferencia"
      linhaDeCorte="2030-01-01T00:00:00Z"
      onVoltar={() => {}}
      onConfirmar={() => {}}
      confirmando={false}
    />,
  )

// Avisos do passo 3 no formato do protótipo v2: cada item numa pílula "Nome · N".
describe('PassoPrevia — avisos', () => {
  it('conta as linhas novas de cada escrevente sem equipe e usa a contagem de tipos do back', () => {
    renderizar(resumo({ tiposDesconhecidosContagem: [{ nome: 'Inventário', quantidade: 3 }] }))

    // Duas linhas novas da Ana (maiúscula ou não); a que já existia não conta.
    expect(screen.getByText('Ana Souza · 2')).toBeInTheDocument()
    expect(screen.getByText('Inventário · 3')).toBeInTheDocument()
    // Texto fiel ao back: o tipo entra no catálogo, não vai para exceções.
    expect(screen.getByText(/Entram no catálogo ao confirmar/)).toBeInTheDocument()
  })

  it('com a API anterior (sem contagem de tipos), mostra só o nome do tipo', () => {
    renderizar(resumo({}))

    expect(screen.getByText('Inventário')).toBeInTheDocument()
  })
})
