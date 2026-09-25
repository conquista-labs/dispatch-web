import { describe, expect, it } from 'vitest'

import type { LookupsFraseRegra, RegraAlcada } from '@/entities/regraAlcada'

import { contagemDaAlcadaEmVigor, itensDeAlcadaEmVigor } from './alcada-em-vigor'

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
  it('pro admin, uma linha por sujeito com o resumo do protótipo — níveis antes de pessoas', () => {
    const itens = itensDeAlcadaEmVigor(
      [
        regra({ id: 'p1', sujeitoConferenteId: 'c1', permissao: 'Permite', alvoTodosOsAtos: true, usos: 2 }),
        regra({ id: 'n1', sujeitoNivel: 'Junior', permissao: 'Permite', alvoTipoAtoId: 't1', usos: 5 }),
        regra({ id: 'n2', sujeitoNivel: 'Junior', permissao: 'Permite', alvoTipoAtoId: 't2', usos: 1 }),
        regra({ id: 'n3', sujeitoNivel: 'Junior', permissao: 'Nega', alvoEtapa: 'PreConferencia' }),
        regra({ id: 'n4', sujeitoNivel: 'Pleno', alvoTipoAtoId: 't1', ativa: false }),
      ],
      lookups,
      true,
    )

    expect(itens).toEqual([
      { frase: 'Analista Júnior: libera 2 tipos · bloqueia pré-conferência', detalhe: '3 regras · 6 aplicações' },
      { frase: 'Conferente c1: libera todos os atos', detalhe: '1 regra · 2 aplicações' },
    ])
  })

  it('pro admin, o trio "equipe não faz etapa" (uma regra por nível) vira uma linha só', () => {
    const trio = (['Junior', 'Pleno', 'Senior'] as const).map((nivel) =>
      regra({
        id: nivel,
        sujeitoNivel: nivel,
        alvoEhEquipeEEtapa: true,
        alvoEquipeId: 'e1',
        alvoEtapa: 'PosConferencia',
      }),
    )

    expect(itensDeAlcadaEmVigor(trio, lookups, true)).toEqual([
      { frase: 'Equipe Equipe e1 não faz pós-conferência', detalhe: '3 regras · 0 aplicações' },
    ])
    expect(contagemDaAlcadaEmVigor(trio)).toBe('0 pessoas e níveis · 3 regras')
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

  it('regra manual vista pela distribuidora é "definida pela administração", não "por você"', () => {
    const regraManual = regra({ id: 'r1', sujeitoConferenteId: 'c1', alvoTipoAtoId: 't1', origem: 'Manual' })

    expect(itensDeAlcadaEmVigor([regraManual], lookups, false)[0].detalhe).toBe('definida pela administração')
  })
})
