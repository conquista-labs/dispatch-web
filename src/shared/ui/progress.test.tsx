import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Progress } from './progress'

// Teste de REGRESSÃO, não cobertura de enfeite. O componente gerado pelo `shadcn add` tinha um
// bug real (docs/patterns/shadcn-gotchas.md, nº 9): desestruturava `value` só pra calcular o
// transform do indicador e nunca repassava pro ProgressPrimitive.Root — a Root ficava sempre
// `data-state="indeterminate"`, a barra renderizava com largura 0 e a pessoa via um espaço
// vazio, sem erro nenhum no console. Só apareceu inspecionando o DOM via Playwright; screenshot
// não denunciava. É exatamente a classe de bug que teste de componente pega e o tsc não.
describe('Progress', () => {
  it('repassa o value pro Root — sem isso a barra fica indeterminada e invisível', () => {
    render(<Progress value={40} />)

    const barra = screen.getByRole('progressbar')

    expect(barra).toHaveAttribute('data-state', 'loading')
    expect(barra).toHaveAttribute('aria-valuenow', '40')
  })

  it('desloca o indicador proporcionalmente ao value', () => {
    const { container } = render(<Progress value={40} />)

    const indicador = container.querySelector('[data-slot="progress-indicator"]')

    expect(indicador).toHaveStyle({ transform: 'translateX(-60%)' })
  })

  it('trata value ausente como 0 em vez de quebrar', () => {
    const { container } = render(<Progress />)

    const indicador = container.querySelector('[data-slot="progress-indicator"]')

    expect(indicador).toHaveStyle({ transform: 'translateX(-100%)' })
  })
})
