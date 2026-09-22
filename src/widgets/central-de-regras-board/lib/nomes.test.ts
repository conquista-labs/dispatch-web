import { describe, expect, it } from 'vitest'

import type { Conferente } from '@/entities/conferente'
import type { Equipe } from '@/entities/equipe'
import type { TipoAto } from '@/entities/tipoAto'

import { criarNomesDaCentralDeRegras } from './nomes'

describe('criarNomesDaCentralDeRegras', () => {
  it('monta os 3 Maps id→nome a partir das listas', () => {
    const conferentes = [{ id: 'c1', nome: 'Ana' }] as Conferente[]
    const tiposAto = [{ id: 't1', nome: 'Venda' }] as TipoAto[]
    const equipes = [{ id: 'e1', nome: 'Equipe RIO' }] as Equipe[]

    const { nomePorConferenteId, nomePorTipoAtoId, nomePorEquipeId } = criarNomesDaCentralDeRegras(
      conferentes,
      tiposAto,
      equipes,
    )

    expect(nomePorConferenteId.get('c1')).toBe('Ana')
    expect(nomePorTipoAtoId.get('t1')).toBe('Venda')
    expect(nomePorEquipeId.get('e1')).toBe('Equipe RIO')
  })

  it('listas vazias resolvem Maps vazios, sem lançar', () => {
    const { nomePorConferenteId, nomePorTipoAtoId, nomePorEquipeId } = criarNomesDaCentralDeRegras([], [], [])

    expect(nomePorConferenteId.size).toBe(0)
    expect(nomePorTipoAtoId.size).toBe(0)
    expect(nomePorEquipeId.size).toBe(0)
  })

  it('id sem correspondência resolve undefined (chamador decide o fallback)', () => {
    const { nomePorConferenteId } = criarNomesDaCentralDeRegras([], [], [])

    expect(nomePorConferenteId.get('inexistente')).toBeUndefined()
  })
})
