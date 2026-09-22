import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SurfaceCard } from './surface-card'

// A regra que vale travar aqui não é "renderiza uma div" — é o `compoundVariants`: `destaque`
// (card "Em conferência", estado de UI) sempre vence `tom` (faixa do semáforo, leitura de
// prazo). Isso está documentado em comentário no componente justamente porque não é óbvio
// lendo o JSX, e depende da ordem em que cva + tailwind-merge resolvem classe conflitante —
// exatamente o tipo de coisa que quebra silenciosamente numa refatoração.
describe('SurfaceCard', () => {
  const classesDe = (ui: React.ReactElement) => (render(ui).container.firstChild as HTMLElement).className

  it('não tinge o card nos tons neutro/ok — só o chip muda nesses casos', () => {
    expect(classesDe(<SurfaceCard />)).toContain('bg-card')
    expect(classesDe(<SurfaceCard tom="ok" />)).toContain('bg-card')
  })

  it('tinge o card inteiro nos tons de risco (RF-14)', () => {
    expect(classesDe(<SurfaceCard tom="atencao" />)).toContain('bg-warn-bg')
    expect(classesDe(<SurfaceCard tom="critico" />)).toContain('bg-crit-bg')
    expect(classesDe(<SurfaceCard tom="vencido" />)).toContain('bg-bad-bg')
  })

  it('destaque sobrepõe o tom, mesmo num tom de risco', () => {
    const classes = classesDe(<SurfaceCard tom="vencido" destaque />)

    expect(classes).toContain('border-primary!')
    expect(classes).toContain('bg-card!')
  })
})
