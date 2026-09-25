import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NumeroConferenciaTag } from './NumeroConferenciaTag'

describe('NumeroConferenciaTag', () => {
  it('não renderiza nada na primeira conferência', () => {
    const { container } = render(<NumeroConferenciaTag numero={1} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra "↻ 2ª conferência" com o tom neutro (tracejado), não o vermelho de urgência', () => {
    render(<NumeroConferenciaTag numero={2} />)
    const tag = screen.getByText('↻ 2ª conferência')
    expect(tag.className).toContain('border-dashed')
    expect(tag.className).not.toContain('bg-bad-bg')
  })

  // Na coluna estreita só cabe "↻ 3ª" — o title é o que explica a tag.
  it('na variante curta guarda o texto completo no title', () => {
    render(<NumeroConferenciaTag numero={3} variante="curta" />)
    expect(screen.getByText('↻ 3ª')).toHaveAttribute('title', '3ª conferência — voltou depois de não aprovado')
  })
})
