import { describe, expect, it } from 'vitest'

import { migrarSessao } from './session-store'

// Regressão do bug real de produção (ver session-store.ts e dispatch-web/CLAUDE.md, "Uma conta
// com os dois papéis"): sessão persistida antes de `papeis` virar lista guardava `papel`
// singular — sem migrar, `usuario.papeis.includes(...)` (AppShell/Dashboard/RequireRole) quebra
// com TypeError assim que a página carrega.
describe('migrarSessao', () => {
  it('sessão v0 com papel singular vira papeis: [papel]', () => {
    const persistido = { token: 'abc', usuario: { id: '1', nome: 'Maria', email: 'm@x.com', papel: 'Distribuidora' } }

    const migrado = migrarSessao(persistido, 0)

    expect(migrado.usuario).toEqual({ id: '1', nome: 'Maria', email: 'm@x.com', papeis: ['Distribuidora'] })
    expect(migrado.token).toBe('abc')
  })

  it('sessão já na v1, com papeis, passa intacta', () => {
    const persistido = {
      token: 'abc',
      usuario: { id: '1', nome: 'Maria', email: 'm@x.com', papeis: ['Distribuidora', 'Conferente'] },
    }

    const migrado = migrarSessao(persistido, 1)

    expect(migrado).toEqual(persistido)
  })

  it('sessão sem usuário (nunca logou) não quebra', () => {
    const persistido = { token: null, usuario: null }

    const migrado = migrarSessao(persistido, 0)

    expect(migrado).toEqual(persistido)
  })

  it('versão >= 1 com formato v0 (não deveria acontecer, mas não quebra) não migra', () => {
    const persistido = { token: 'abc', usuario: { id: '1', nome: 'Maria', email: 'm@x.com', papel: 'Distribuidora' } }

    const migrado = migrarSessao(persistido, 1)

    expect(migrado.usuario).toEqual({ id: '1', nome: 'Maria', email: 'm@x.com', papel: 'Distribuidora' })
  })
})
