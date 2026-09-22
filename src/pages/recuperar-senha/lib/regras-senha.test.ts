import { describe, expect, it } from 'vitest'

import { avaliarRegrasSenha } from './regras-senha'

// Mesmas 3 regras do back (Dispatch.Domain.RegrasDeSenha) — o front é só feedback ao vivo, mas
// precisa bater exatamente, senão o botão "Salvar nova senha" libera algo que o back rejeita.
describe('avaliarRegrasSenha', () => {
  it('senha curta falha no comprimento e na "não óbvia" (que também exige 12+)', () => {
    const [comprimento, naoObvia] = avaliarRegrasSenha('abc12345', 'abc12345')
    expect(comprimento.ok).toBe(false)
    expect(naoObvia.ok).toBe(false)
  })

  it('senha com 12+ caracteres mas começando com prefixo óbvio falha só na regra de "óbvia"', () => {
    const [comprimento, naoObvia] = avaliarRegrasSenha('senha12345678', 'senha12345678')
    expect(comprimento.ok).toBe(true)
    expect(naoObvia.ok).toBe(false)
  })

  it('prefixo óbvio é case-insensitive', () => {
    const [, naoObvia] = avaliarRegrasSenha('SENHA12345678', 'SENHA12345678')
    expect(naoObvia.ok).toBe(false)
  })

  it('senha forte e igual nos dois campos passa nas 3 regras', () => {
    const regras = avaliarRegrasSenha('umaSenhaBoaDeVerdade', 'umaSenhaBoaDeVerdade')
    expect(regras.every((r) => r.ok)).toBe(true)
  })

  it('senhas diferentes falham só na regra "as duas iguais"', () => {
    const [comprimento, naoObvia, iguais] = avaliarRegrasSenha('umaSenhaBoaDeVerdade', 'outraSenhaBoaDeVerdade')
    expect(comprimento.ok).toBe(true)
    expect(naoObvia.ok).toBe(true)
    expect(iguais.ok).toBe(false)
  })

  it('campos vazios não batem "as duas iguais" (evita passar com os dois em branco)', () => {
    const [, , iguais] = avaliarRegrasSenha('', '')
    expect(iguais.ok).toBe(false)
  })
})
