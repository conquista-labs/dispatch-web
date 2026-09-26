import { describe, expect, it } from 'vitest'

import type { RegraDoPool } from '@/entities/protocolo'

import { orientacaoDoPool, podePegarDoPool } from './regra-do-pool'

const regra = (extra: Partial<RegraDoPool> = {}): RegraDoPool => ({
  ordemObrigatoria: true,
  limiteNaMao: 5,
  naMao: 2,
  proximoId: 'a',
  ...extra,
})

describe('podePegarDoPool', () => {
  it('com a ordem obrigatória, só o próximo da vez', () => {
    expect(podePegarDoPool('a', regra())).toBe(true)
    expect(podePegarDoPool('b', regra())).toBe(false)
  })

  it('no limite, nenhum', () => {
    expect(podePegarDoPool('a', regra({ naMao: 5, proximoId: null }))).toBe(false)
  })

  it('com a ordem desligada, qualquer um abaixo do limite', () => {
    expect(podePegarDoPool('b', regra({ ordemObrigatoria: false }))).toBe(true)
    expect(podePegarDoPool('b', regra({ ordemObrigatoria: false, naMao: 5 }))).toBe(false)
  })

  it('sem a regra (API anterior), qualquer um', () => {
    expect(podePegarDoPool('b', undefined)).toBe(true)
  })
})

describe('orientacaoDoPool', () => {
  it('explica a ordem e mostra quantos na mão', () => {
    expect(orientacaoDoPool(regra(), true)).toBe(
      'Pegue na ordem da fila: prioridade alta primeiro, depois quem vence antes. 2 de 5 na mão.',
    )
  })

  it('no limite, pede pra concluir um', () => {
    expect(orientacaoDoPool(regra({ naMao: 5, proximoId: null }), true)).toBe(
      'Você está com 5 de 5 na mão — conclua um para pegar o próximo do pool.',
    )
  })

  it('avisa quando o filtro esconde o próximo', () => {
    expect(orientacaoDoPool(regra(), false)).toMatch(/escondido pelos filtros/)
  })

  it('sem a regra, nada a dizer', () => {
    expect(orientacaoDoPool(undefined, true)).toBeNull()
  })
})
