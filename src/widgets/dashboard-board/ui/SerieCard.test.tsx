import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SerieCard } from './SerieCard'

describe('SerieCard', () => {
  it('uma barra por ponto, rótulos do mês, dia futuro sem barra e contagem no title', () => {
    render(
      <SerieCard
        periodo="Mes"
        serie={{
          granularidade: 'Dia',
          pontos: [
            { inicio: '2026-09-24', conferidos: 10, estourados: 2, futuro: false },
            { inicio: '2026-09-25', conferidos: 4, estourados: 0, futuro: false },
            { inicio: '2026-09-28', conferidos: 0, estourados: 0, futuro: true },
          ],
        }}
      />,
    )

    expect(screen.getByText('Conferidos por dia')).toBeInTheDocument()
    expect(screen.getByText('dias úteis do mês')).toBeInTheDocument()
    expect(screen.getByTitle('10 conferidos · 2 estourados')).toBeInTheDocument()
    expect(screen.getByTitle('28')).toBeInTheDocument()
    expect(['24', '25', '28'].every((d) => screen.getByText(d))).toBe(true)
  })

  it('trimestre em semanas', () => {
    render(
      <SerieCard
        periodo="Trimestre"
        serie={{
          granularidade: 'Semana',
          pontos: [{ inicio: '2026-07-06', conferidos: 30, estourados: 3, futuro: false }],
        }}
      />,
    )

    expect(screen.getByText('Conferidos por semana')).toBeInTheDocument()
    expect(screen.getByText('S1')).toBeInTheDocument()
  })
})
