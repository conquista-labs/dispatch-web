import { describe, expect, it } from 'vitest'

import type { Sugestao } from '../model/types'
import { textoBaseDaSugestao, tituloDaSugestao, type LookupsFraseSugestao } from './frase'

const sugestaoBase: Sugestao = {
  id: 's1',
  tipo: 'TipoDesconhecido',
  chave: 'k',
  evidencia: 'ev',
  ocorrencias: 5,
  indiceConfianca: 0.8,
  status: 'Pendente',
  criadaEm: '2026-01-01T00:00:00Z',
  atualizadaEm: '2026-01-01T00:00:00Z',
  decididaEm: null,
  descartarAte: null,
  tipoDesconhecidoNomeTipo: null,
  tipoDesconhecidoNivelSugerido: null,
  prazoIrrealEquipeId: null,
  prazoIrrealEtapa: null,
  prazoIrrealPrazoSugerido: null,
  escreventeOrfaoEscreventeId: null,
  escreventeOrfaoEquipeSugeridaId: null,
  riscoQualidadeTipoAtoId: null,
  riscoQualidadeNivelRestrito: null,
}

const lookups: LookupsFraseSugestao = {
  nomeEquipe: (id) => `Equipe ${id}`,
  nomeEscrevente: (id) => `Escrevente ${id}`,
  nomeTipoAto: (id) => `Tipo ${id}`,
}

// RF-39: back manda só ids/enums + evidência numérica, quem escreve a frase legível é o front —
// um payload por tipo (só um dos 4 grupos de campo preenchido por vez, conforme `sugestao.tipo`).
describe('tituloDaSugestao', () => {
  it('TipoDesconhecido usa o nome bruto do relatório', () => {
    const sugestao = { ...sugestaoBase, tipo: 'TipoDesconhecido' as const, tipoDesconhecidoNomeTipo: 'Usucapião' }
    expect(tituloDaSugestao(sugestao, lookups)).toBe('Classificar "Usucapião" como tipo de ato')
  })

  it('PrazoIrreal resolve etapa e nome da equipe via lookup', () => {
    const sugestao = {
      ...sugestaoBase,
      tipo: 'PrazoIrreal' as const,
      prazoIrrealEtapa: 'PosConferencia' as const,
      prazoIrrealEquipeId: 'eq1',
    }
    expect(tituloDaSugestao(sugestao, lookups)).toBe('Ajustar prazo de pós-conferência da equipe Equipe eq1')
  })

  it('EscreventeOrfao resolve nome do escrevente e da equipe sugerida', () => {
    const sugestao = {
      ...sugestaoBase,
      tipo: 'EscreventeOrfao' as const,
      escreventeOrfaoEscreventeId: 'esc1',
      escreventeOrfaoEquipeSugeridaId: 'eq2',
    }
    expect(tituloDaSugestao(sugestao, lookups)).toBe('Alocar Escrevente esc1 na equipe Equipe eq2')
  })

  it('RiscoQualidade resolve tipo de ato e rótulo do nível', () => {
    const sugestao = {
      ...sugestaoBase,
      tipo: 'RiscoQualidade' as const,
      riscoQualidadeTipoAtoId: 'tp1',
      riscoQualidadeNivelRestrito: 'Junior' as const,
    }
    expect(tituloDaSugestao(sugestao, lookups)).toBe('Restringir Tipo tp1 pro nível Júnior')
  })
})

describe('textoBaseDaSugestao', () => {
  it('TipoDesconhecido menciona ocorrências e o nível majoritário', () => {
    const sugestao = { ...sugestaoBase, ocorrencias: 7, tipoDesconhecidoNivelSugerido: 'Pleno' as const }
    expect(textoBaseDaSugestao(sugestao)).toContain('7 protocolos')
    expect(textoBaseDaSugestao(sugestao)).toContain('Pleno')
  })

  it('PrazoIrreal menciona o prazo sugerido', () => {
    const sugestao = { ...sugestaoBase, tipo: 'PrazoIrreal' as const, prazoIrrealPrazoSugerido: 'D2' as const }
    expect(textoBaseDaSugestao(sugestao)).toContain('60%')
  })

  it('RiscoQualidade não depende de contagem de ocorrências (é sobre % de reprovação)', () => {
    const sugestao = { ...sugestaoBase, tipo: 'RiscoQualidade' as const }
    expect(textoBaseDaSugestao(sugestao)).toContain('50%')
  })
})
