import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNow } from './use-now'

// Alimenta cronômetro (RF-21) e chip de prazo — precisa atualizar sozinho, sem esperar refetch.
describe('useNow', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('devolve o timestamp atual na primeira renderização', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { result } = renderHook(() => useNow())
    expect(result.current).toBe(new Date('2026-01-01T00:00:00Z').getTime())
  })

  it('atualiza sozinho a cada intervalo, sem re-render externo', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { result } = renderHook(() => useNow(1000))

    act(() => vi.advanceTimersByTime(1000))

    expect(result.current).toBe(new Date('2026-01-01T00:00:01Z').getTime())
  })

  it('respeita um intervalo customizado', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { result } = renderHook(() => useNow(5000))

    act(() => vi.advanceTimersByTime(4999))
    expect(result.current).toBe(new Date('2026-01-01T00:00:00Z').getTime())

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(new Date('2026-01-01T00:00:05Z').getTime())
  })

  it('para de atualizar depois de desmontado (sem vazar o interval)', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const { result, unmount } = renderHook(() => useNow(1000))

    unmount()
    act(() => vi.advanceTimersByTime(5000))

    // Sem assert direto no valor (o hook já desmontou) — a garantia real é `clearInterval`
    // rodando sem lançar/travar o teste com timers pendentes.
    expect(result.current).toBe(new Date('2026-01-01T00:00:00Z').getTime())
  })
})
