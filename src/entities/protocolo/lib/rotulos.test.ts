import { describe, expect, it } from 'vitest'

import { rotuloNumeroConferencia } from './rotulos'

// RF-24k: a 1ª conferência não tem rótulo nenhum — a tag só existe a partir da 2ª.
describe('rotuloNumeroConferencia', () => {
  it('não rotula a primeira conferência', () => {
    expect(rotuloNumeroConferencia(1)).toBeNull()
    expect(rotuloNumeroConferencia(1, 'curta')).toBeNull()
  })

  it('não rotula quando o campo ainda não veio da API (front publicado antes do back)', () => {
    expect(rotuloNumeroConferencia(undefined as unknown as number)).toBeNull()
  })

  it('escreve o ordinal nas três variantes', () => {
    expect(rotuloNumeroConferencia(2)).toBe('↻ 2ª conferência')
    expect(rotuloNumeroConferencia(3, 'media')).toBe('↻ 3ª conf.')
    expect(rotuloNumeroConferencia(4, 'curta')).toBe('↻ 4ª')
  })
})
