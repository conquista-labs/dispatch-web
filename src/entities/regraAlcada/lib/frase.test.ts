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
  origem: 'Manual',
  ativa: true,
  usos: 0,
  ...sobrescreve,
})

describe('fraseDaRegra — sujeito', () => {
  it('nível vira "Nível X"', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Junior', alvoTodosOsAtos: true }), lookups)
    expect(frase).toBe('Nível Júnior pode conferir todos os atos')
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
    expect(frase).toBe('Nível Pleno não pode fazer pré-conferência')
  })

  it('tipo de ato', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Senior', alvoTipoAtoId: 't1' }), lookups)
    expect(frase).toBe('Nível Sênior pode conferir Tipo t1')
  })

  it('equipe com id', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Pleno', alvoEhEquipe: true, alvoEquipeId: 'e1' }), lookups)
    expect(frase).toBe('Nível Pleno pode conferir atos da equipe Equipe e1')
  })

  it('equipe nula — "sem equipe" é alvo válido (RF-29a)', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Pleno', alvoEhEquipe: true, alvoEquipeId: null }), lookups)
    expect(frase).toBe('Nível Pleno pode conferir atos de escreventes sem equipe')
  })

  it('grupo de tipo de ato', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Junior', alvoGrupo: 'Notariais' }), lookups)
    expect(frase).toBe('Nível Júnior pode conferir atos de Notariais')
  })

  it('todos os atos (alçada plena)', () => {
    const frase = fraseDaRegra(novaRegra({ sujeitoNivel: 'Senior', alvoTodosOsAtos: true }), lookups)
    expect(frase).toBe('Nível Sênior pode conferir todos os atos')
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
    expect(frase).toBe('Só Nível Pleno confere atos de escreventes sem equipe')
  })
})
