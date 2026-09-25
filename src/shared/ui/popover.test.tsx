import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Popover, PopoverContent, PopoverTrigger } from './popover'

// Regressão do bug real (ver popover.tsx e docs/patterns/shadcn-gotchas.md, nº 11; histórico em
// docs/historico.md, "Modal 'Novo protocolo': hora de entrada + scroll do Popover"):
// Dialog/Sheet/AlertDialog (Radix) travam o scroll da página (`data-scroll-locked` no <body>)
// enquanto abertos, e isso intercepta o wheel de qualquer
// Popover aninhado — mesmo um com overflow-y-auto correto — porque o conteúdo do Popover é
// portalizado pra fora da árvore DOM do Dialog.
const tornarRolavel = (el: HTMLElement, scrollHeight: number, clientHeight: number) => {
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
}

describe('PopoverContent — onWheel', () => {
  afterEach(() => document.body.removeAttribute('data-scroll-locked'))

  it('fora de um Dialog (sem data-scroll-locked), não intercepta o wheel — scroll nativo intacto', async () => {
    render(
      <Popover open>
        <PopoverTrigger>abrir</PopoverTrigger>
        <PopoverContent>
          <div data-testid="conteudo">item</div>
        </PopoverContent>
      </Popover>,
    )
    const conteudo = await screen.findByText('item')
    const popoverContent = conteudo.closest('[data-slot="popover-content"]') as HTMLElement
    tornarRolavel(popoverContent, 500, 100)

    const naoCancelado = fireEvent.wheel(popoverContent, { deltaY: 100 })

    // `fireEvent` devolve `true` quando o evento NÃO foi cancelado (preventDefault não chamado)
    // — sem data-scroll-locked, nosso onWheel não deveria interceder.
    expect(naoCancelado).toBe(true)
  })

  it('dentro de um Dialog travado (data-scroll-locked), rola o próprio PopoverContent manualmente', async () => {
    document.body.setAttribute('data-scroll-locked', '')
    render(
      <Popover open>
        <PopoverTrigger>abrir</PopoverTrigger>
        <PopoverContent>
          <div data-testid="conteudo">item</div>
        </PopoverContent>
      </Popover>,
    )
    const conteudo = await screen.findByText('item')
    const popoverContent = conteudo.closest('[data-slot="popover-content"]') as HTMLElement
    tornarRolavel(popoverContent, 500, 100)
    popoverContent.scrollTop = 0

    fireEvent.wheel(popoverContent, { deltaY: 120 })

    expect(popoverContent.scrollTop).toBe(120)
  })

  it('quando quem rola é um FILHO interno (ex.: DateTimePicker), sobe até achar o ancestral rolável certo', async () => {
    document.body.setAttribute('data-scroll-locked', '')
    render(
      <Popover open>
        <PopoverTrigger>abrir</PopoverTrigger>
        <PopoverContent>
          <div data-testid="area-rolavel">
            <span>item filho</span>
          </div>
          <div data-testid="rodape-fixo">Pronto</div>
        </PopoverContent>
      </Popover>,
    )
    const itemFilho = await screen.findByText('item filho')
    const popoverContent = itemFilho.closest('[data-slot="popover-content"]') as HTMLElement
    const areaRolavel = screen.getByTestId('area-rolavel')
    // O PopoverContent em si NÃO rola (mesmo tamanho) — só o filho interno rola, mesmo padrão
    // do DateTimePicker (rodapé de botões sempre visível, fora da área rolável).
    tornarRolavel(popoverContent, 100, 100)
    tornarRolavel(areaRolavel, 500, 100)
    areaRolavel.scrollTop = 0

    fireEvent.wheel(itemFilho, { deltaY: 80 })

    expect(areaRolavel.scrollTop).toBe(80)
  })
})
