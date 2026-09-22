import { afterEach, describe, expect, it } from 'vitest'

import { useSidebarStore } from './sidebar-store'

// Estado de UI só do desktop (RNF-13: sidebar nem existe abaixo do breakpoint mobile).
describe('useSidebarStore', () => {
  afterEach(() => useSidebarStore.setState({ recolhida: false }))

  it('começa expandida (recolhida: false)', () => {
    expect(useSidebarStore.getState().recolhida).toBe(false)
  })

  it('toggleRecolhida alterna o estado', () => {
    useSidebarStore.getState().toggleRecolhida()
    expect(useSidebarStore.getState().recolhida).toBe(true)

    useSidebarStore.getState().toggleRecolhida()
    expect(useSidebarStore.getState().recolhida).toBe(false)
  })
})
