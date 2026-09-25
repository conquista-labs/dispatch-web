import { describe, expect, it } from 'vitest'

import type { LookupsFraseRegra } from './frase'
import { fraseDaRegra } from './frase'
import type { RegraAlcada } from '../model/types'

const lookups: LookupsFraseRegra = {
  nomeConferente: (id) => `Conferente ${id}`,
  nomeTipoAto: (id) => `Tipo ${id}`,
  nomeEquipe: (id) => `Equipe ${id}`,
}

const novaRegra = (sobrescreve: Partial<RegraAlcada> = {}): RegraAlcada => ({
  id: 'regra-1',
  sujeitoNivel: null,
  sujeitoConferenteId: null,
  permissao: 'Permite',
  alvoEtapa: null,
  alvoTipoAtoId: null,
  alvoEhEquipe: false,
  alvoEquipeId: null,
  alvoTodosOsAtos: false,
  alvoGrupo: null,
  alvoEhEquipeEEtapa: false,
  origem: 'Manual',
  ativa: true,
  usos: 0,
  regraBase: false,
  ...sobrescreve,
})

describe('fraseDaRegra — sujeito', () => {
  it('nível vira "Analista X"', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Junior', alvoTodosOsAtos: true }), lookups)
    expect(frase).toBe('Analista Júnior pode conferir todos os atos')
  })

  it('pessoa resolve o nome via lookup', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoConferenteId: 'c1', alvoTodosOsAtos: true }), lookups)
    expect(frase).toBe('Conferente c1 pode conferir todos os atos')
  })
})

describe('fraseDaRegra — alvo (Permite/Nega)', () => {
  it('etapa', () => {
    const frase = fraseDaRegra(
      novaRegra({ sujeitoNivel: 'Pleno', permissao: 'Nega', alvoEtapa: 'PreConferencia' }),
      lookups,
    )
    expect(frase).toBe('Analista Pleno não pode fazer pré-conferência')
  })

  it('tipo de ato', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Senior', alvoTipoAtoId: 't1' }), lookups)
    expect(frase).toBe('Analista Sênior pode conferir Tipo t1')
  })

  it('equipe com id', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Pleno', alvoEhEquipe: true, alvoEquipeId: 'e1' }), lookups)
    expect(frase).toBe('Analista Pleno pode conferir atos da equipe Equipe e1')
  })

  it('equipe nula — "sem equipe" é alvo válido (RF-29a)', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Pleno', alvoEhEquipe: true, alvoEquipeId: null }), lookups)
    expect(frase).toBe('Analista Pleno pode conferir atos de escreventes sem equipe')
  })

  it('grupo de tipo de ato', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Junior', alvoGrupo: 'Notariais' }), lookups)
    expect(frase).toBe('Analista Júnior pode conferir atos de Notariais')
  })

  it('todos os atos (alçada plena)', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Senior', alvoTodosOsAtos: true }), lookups)
    expect(frase).toBe('Analista Sênior pode conferir todos os atos')
  })

  it('equipe + etapa (Motor v4) com equipe', () => {
    const frase = fraseDaRegra(
      novaRegra({
        sujeitoNivel: 'Junior',
        permissao: 'Nega',
        alvoEhEquipeEEtapa: true,
        alvoEquipeId: 'e1',
        alvoEtapa: 'PreConferencia',
      }),
      lookups,
    )
    expect(frase).toBe('Analista Júnior não pode fazer pré-conferência da equipe Equipe e1')
  })

  it('equipe + etapa (Motor v4) sem equipe', () => {
    const frase = fraseDaRegra(
      novaRegra({
        sujeitoNivel: 'Junior',
        permissao: 'Nega',
        alvoEhEquipeEEtapa: true,
        alvoEquipeId: null,
        alvoEtapa: 'PosConferencia',
      }),
      lookups,
    )
    expect(frase).toBe('Analista Júnior não pode fazer pós-conferência de escreventes sem equipe')
  })
})

describe('fraseDaRegra — Reserva', () => {
  it('usa o molde "Só X confere Y", sem o verbo pode/não pode', () => {
    const frase = fraseDaRegra(
      novaRegra({ sujeitoConferenteId: 'c1', permissao: 'Reserva', alvoTipoAtoId: 't1' }),
      lookups,
    )
    expect(frase).toBe('Só Conferente c1 confere Tipo t1')
  })

  it('Reserva sobre equipe sem id vira "de escreventes sem equipe"', () => {
    const frase = fraseDaRegra(
      novaRegra({ sujeitoNivel: 'Pleno', permissao: 'Reserva', alvoEhEquipe: true, alvoEquipeId: null }),
      lookups,
    )
    expect(frase).toBe('Só Analista Pleno confere atos de escreventes sem equipe')
  })
})
