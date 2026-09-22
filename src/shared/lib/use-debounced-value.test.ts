import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from './use-debounced-value'

// A busca paginada de Tipos de ato é o único consumidor real — sem isso, cada tecla dispara um
// GET novo contra o back.
describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('devolve o valor inicial na hora, sem esperar o atraso', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300))
    expect(result.current).toBe('a')
  })

  it('não repassa o valor novo antes do atraso terminar', () => {
    const { result, rerender } = renderHook(({ valor }) => useDebouncedValue(valor, 300), {
      initialProps: { valor: 'a' },
    })

    rerender({ valor: 'ab' })
    act(() => vi.advanceTimersByTime(299))

    expect(result.current).toBe('a')
  })

  it('repassa o valor novo depois do atraso', () => {
    const { result, rerender } = renderHook(({ valor }) => useDebouncedValue(valor, 300), {
      initialProps: { valor: 'a' },
    })

    rerender({ valor: 'ab' })
    act(() => vi.advanceTimersByTime(300))

    expect(result.current).toBe('ab')
  })

  it('digitação rápida reinicia o timer — só o último valor sobrevive', () => {
    const { result, rerender } = renderHook(({ valor }) => useDebouncedValue(valor, 300), {
      initialProps: { valor: 'a' },
    })

    rerender({ valor: 'ab' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ valor: 'abc' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a') // ainda não passou 300ms desde o último rerender

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('abc')
  })
})
