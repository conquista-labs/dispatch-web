import { describe, expect, it } from 'vitest'

import type { Conta } from '../model/types'
import { ehTravaDeDesativacao, MOTIVO_DA_TRAVA, travaDeDesativacao } from './trava-de-desativacao'

const conta = (sobrescreve: Partial<Conta>): Conta => ({
  id: 'c-1',
  nome: 'Letícia Andrade',
  email: 'leticia@cartorio.com',
  papel: 'Distribuidora',
  ativo: true,
  tambemConfere: false,
  ehVoce: false,
  ...sobrescreve,
})

// Os códigos têm de ser os mesmos do 409 do back (DesativarConta) — o front só antecipa o aviso.
describe('travaDeDesativacao', () => {
  const eu = conta({ id: 'eu', nome: 'Maria Vittoria', papel: 'Administrador', ehVoce: true })
  const outraAdmin = conta({ id: 'a2', nome: 'Rita Souza', papel: 'Administrador' })
  const distribuidora = conta({ id: 'd1' })

  it('a própria conta, sendo a última administradora, trava com os dois motivos', () => {
    expect(travaDeDesativacao(eu, [eu, distribuidora])).toBe('propria_e_ultimo_administrador')
  })

  it('a própria conta com outra administradora ativa trava só por ser a própria', () => {
    expect(travaDeDesativacao(eu, [eu, outraAdmin])).toBe('propria_conta')
  })

  it('a última administradora ativa (de outra pessoa) trava', () => {
    const euDistribuidora = conta({ id: 'eu', ehVoce: true })
    expect(travaDeDesativacao(outraAdmin, [euDistribuidora, outraAdmin])).toBe('ultimo_administrador')
  })

  it('administradora inativa não conta como "sobra uma"', () => {
    const inativa = conta({ id: 'a3', papel: 'Administrador', ativo: false })
    expect(travaDeDesativacao(outraAdmin, [eu, outraAdmin, inativa])).toBeNull()
    expect(travaDeDesativacao(eu, [eu, inativa])).toBe('propria_e_ultimo_administrador')
  })

  it('distribuidora de outra pessoa não tem trava', () => {
    expect(travaDeDesativacao(distribuidora, [eu, distribuidora])).toBeNull()
  })

  it('o texto da última administradora usa o primeiro nome dela', () => {
    expect(MOTIVO_DA_TRAVA.ultimo_administrador(outraAdmin)).toMatch(/^Rita é o último administrador ativo\./)
  })

  it('reconhece só os códigos de trava vindos do back', () => {
    expect(ehTravaDeDesativacao('propria_conta')).toBe(true)
    expect(ehTravaDeDesativacao('ja_inativa')).toBe(false)
    expect(ehTravaDeDesativacao(undefined)).toBe(false)
  })
})
