import { describe, expect, it } from 'vitest'

import { gerarSenhaInicial, SENHA_INICIAL_MINIMA } from './gerar-senha-inicial'

describe('gerarSenhaInicial', () => {
  it('segue o formato xxxx-xxxx-NN do protótipo, sem caracteres ambíguos', () => {
    for (let i = 0; i < 50; i++) {
      expect(gerarSenhaInicial()).toMatch(/^[a-km-np-z2-9]{4}-[a-km-np-z2-9]{4}-[1-9]\d$/)
    }
  })

  it('passa do mínimo de senha inicial do back', () => {
    expect(gerarSenhaInicial().length).toBeGreaterThanOrEqual(SENHA_INICIAL_MINIMA)
  })

  it('não repete (usa crypto.getRandomValues)', () => {
    const geradas = new Set(Array.from({ length: 20 }, gerarSenhaInicial))
    expect(geradas.size).toBe(20)
  })
})
