import { afterEach, describe, expect, it } from 'vitest'

import { useThemeStore } from './theme-store'

// RF-04: alternador de tema — aplica a classe `.dark` direto no <html> (é o que o
// `@custom-variant dark` do Tailwind espera), persistido por navegador.
describe('useThemeStore', () => {
  afterEach(() => {
    useThemeStore.setState({ tema: 'light' })
    document.documentElement.classList.remove('dark')
  })

  it('toggleTema de light pra dark aplica a classe .dark no <html>', () => {
    useThemeStore.setState({ tema: 'light' })
    document.documentElement.classList.remove('dark')

    useThemeStore.getState().toggleTema()

    expect(useThemeStore.getState().tema).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTema de dark pra light remove a classe .dark', () => {
    useThemeStore.setState({ tema: 'dark' })
    document.documentElement.classList.add('dark')

    useThemeStore.getState().toggleTema()

    expect(useThemeStore.getState().tema).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
