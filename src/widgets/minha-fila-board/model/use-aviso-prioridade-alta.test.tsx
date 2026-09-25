import { renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AltaPendente } from '../lib/prioridade-alta'
import { protocoloDeTeste } from '../lib/test/protocolo-de-teste'
import { useAvisoPrioridadeAlta } from './use-aviso-prioridade-alta'

vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }))

const alta = (id: string, onde: AltaPendente['onde'] = 'pool'): AltaPendente => ({
  protocolo: protocoloDeTeste(id, { numero: `N-${id}`, prioridade: 'Alta' }),
  onde,
})

type Props = { altas: AltaPendente[]; atualizadoEm: number; usuarioId: string }

const montar = (inicial: Props) =>
  renderHook((props: Props) => useAvisoPrioridadeAlta({ ...props, onVer: vi.fn(), onVerTodos: vi.fn() }), {
    initialProps: inicial,
  })

describe('useAvisoPrioridadeAlta (RF-24i)', () => {
  beforeEach(() => vi.mocked(toast.warning).mockClear())
  afterEach(() => sessionStorage.clear())

  it('primeira carga da sessão não avisa — a faixa já mostra', () => {
    montar({ altas: [alta('a')], atualizadoEm: 1, usuarioId: 'u1' })
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('um alto novo na atualização seguinte: um toast com o número e o destino', () => {
    const { rerender } = montar({ altas: [alta('a')], atualizadoEm: 1, usuarioId: 'u1' })
    rerender({ altas: [alta('a'), alta('b', 'minhas')], atualizadoEm: 2, usuarioId: 'u1' })

    expect(toast.warning).toHaveBeenCalledTimes(1)
    expect(toast.warning).toHaveBeenCalledWith(
      'Protocolo N-b chegou com prioridade alta',
      expect.objectContaining({ description: 'atribuído a você', id: 'alta-b' }),
    )
  })

  it('vários novos na mesma atualização viram um toast resumo', () => {
    const { rerender } = montar({ altas: [], atualizadoEm: 1, usuarioId: 'u1' })
    rerender({ altas: [alta('b'), alta('c')], atualizadoEm: 2, usuarioId: 'u1' })

    expect(toast.warning).toHaveBeenCalledTimes(1)
    expect(toast.warning).toHaveBeenCalledWith('2 protocolos chegaram com prioridade alta', expect.anything())
  })

  it('o mesmo protocolo não avisa de novo — nem na atualização seguinte, nem ao remontar (F5)', () => {
    const { rerender, unmount } = montar({ altas: [], atualizadoEm: 1, usuarioId: 'u1' })
    rerender({ altas: [alta('b')], atualizadoEm: 2, usuarioId: 'u1' })
    rerender({ altas: [alta('b')], atualizadoEm: 3, usuarioId: 'u1' })
    unmount()
    montar({ altas: [alta('b')], atualizadoEm: 4, usuarioId: 'u1' })

    expect(toast.warning).toHaveBeenCalledTimes(1)
  })

  it('o conjunto de vistos é por usuário', () => {
    const { rerender } = montar({ altas: [], atualizadoEm: 1, usuarioId: 'u1' })
    rerender({ altas: [alta('b')], atualizadoEm: 2, usuarioId: 'u1' })
    vi.mocked(toast.warning).mockClear()

    // Outro usuário na mesma aba: primeira carga dele, só registra.
    montar({ altas: [alta('b')], atualizadoEm: 3, usuarioId: 'u2' })
    expect(toast.warning).not.toHaveBeenCalled()
  })
})
