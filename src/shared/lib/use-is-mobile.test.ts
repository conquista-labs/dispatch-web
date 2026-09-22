import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useIsMobile } from './use-is-mobile'

// RNF-13/RF-24g: troca sidebar↔barra de chips, 3 colunas↔abas — só usado quando a árvore muda
// de verdade, não pra ajuste visual puro (isso é `max-mobile:` direto no CSS).
const mockMatchMedia = (matchesInicial: boolean) => {
  let listener: (() => void) | null = null
  let matches = matchesInicial
  const mql = {
    get matches() {
      return matches
    },
    media: '(max-width: 759.98px)',
    addEventListener: (_evento: string, cb: () => void) => {
      listener = cb
    },
    removeEventListener: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia
  return {
    dispararMudanca: (novoValor: boolean) => {
      matches = novoValor
      listener?.()
    },
  }
}

describe('useIsMobile', () => {
  const matchMediaOriginal = window.matchMedia
  afterEach(() => {
    window.matchMedia = matchMediaOriginal
  })

  it('começa false quando a media query não bate (desktop)', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('começa true quando a media query já bate (viewport estreita)', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('reage ao evento "change" (redimensionar a janela)', () => {
    const { dispararMudanca } = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())

    act(() => dispararMudanca(true))

    expect(result.current).toBe(true)
  })

  it('remove o listener ao desmontar', () => {
    const removeEventListener = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener,
    }) as unknown as typeof window.matchMedia

    const { unmount } = renderHook(() => useIsMobile())
    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
