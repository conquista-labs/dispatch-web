import { describe, expect, it } from 'vitest'

import type { LookupsFraseRegra, RegraAlcada } from '@/entities/regraAlcada'

import { itensDeAlcadaEmVigor } from './alcada-em-vigor'

const lookups: LookupsFraseRegra = {
  nomeConferente: (id) => `Conferente ${id}`,
  nomeTipoAto: (id) => `Tipo ${id}`,
  nomeEquipe: (id) => `Equipe ${id}`,
}

const regra = (sobrescreve: Partial<RegraAlcada>): RegraAlcada => ({
  id: 'r',
  sujeitoNivel: null,
  sujeitoConferenteId: null,
  permissao: 'Nega',
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

describe('itensDeAlcadaEmVigor', () => {
  it('pro admin, uma linha por regra ativa, com o nível na frase', () => {
    const itens = itensDeAlcadaEmVigor(
      [
        regra({ id: 'r1', sujeitoNivel: 'Junior', alvoTipoAtoId: 't1' }),
        regra({ id: 'r2', sujeitoNivel: 'Pleno', alvoTipoAtoId: 't1', ativa: false }),
      ],
      lookups,
      true,
    )

    expect(itens).toHaveLength(1)
    expect(itens[0].frase).toContain('Nível Júnior')
  })

  it('pra distribuidora, as regras base viram uma linha só, somando as aplicações', () => {
    const itens = itensDeAlcadaEmVigor(
      [
        regra({ id: 'r1', regraBase: true, alvoTipoAtoId: 't1', usos: 3 }),
        regra({ id: 'r2', regraBase: true, alvoTipoAtoId: 't2', usos: 4 }),
      ],
      lookups,
      false,
    )

    expect(itens).toEqual([
      {
        frase: 'Regra base da alçada: vale para todos, conforme o cadastro de cada pessoa',
        detalhe: '2 regras · 7 aplicações',
      },
    ])
  })

  it('pra distribuidora, o trio "equipe não faz etapa" vira uma linha por equipe+etapa', () => {
    const trio = (['a', 'b', 'c'] as const).map((id) =>
      regra({ id, alvoEhEquipeEEtapa: true, alvoEquipeId: 'e1', alvoEtapa: 'PreConferencia', usos: 1 }),
    )
    const semEquipe = regra({ id: 'd', alvoEhEquipeEEtapa: true, alvoEquipeId: null, alvoEtapa: 'PosConferencia' })

    const itens = itensDeAlcadaEmVigor([...trio, semEquipe], lookups, false)

    expect(itens.map((i) => i.frase)).toEqual([
      'Equipe Equipe e1 não faz pré-conferência',
      'Escreventes sem equipe não fazem pós-conferência',
    ])
    expect(itens[0].detalhe).toBe('3 aplicações')
  })

  it('regra por pessoa continua com a frase de sempre', () => {
    const itens = itensDeAlcadaEmVigor(
      [regra({ id: 'r1', sujeitoConferenteId: 'c1', alvoTipoAtoId: 't1', origem: 'Aprendida' })],
      lookups,
      false,
    )

    expect(itens).toEqual([{ frase: expect.stringContaining('Conferente c1'), detalhe: 'aprendida pelo sistema' }])
  })
})
