import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'

import { cn } from '@/shared/lib/utils'

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  onWheel,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        onWheel={(event) => {
          // Dialog/Sheet/AlertDialog (Radix) travam o scroll da página (`data-scroll-locked`
          // no <body>) enquanto abertos — e esse travamento intercepta o wheel de qualquer
          // Popover aninhado dentro deles, mesmo um com overflow-y-auto correto, porque o
          // conteúdo do Popover é portalizado pra fora da árvore DOM do Dialog. Sem isso, um
          // SeletorUnico/SeletorMultiplo dentro de um modal (ex.: "Novo protocolo") fica com a
          // lista comprida sem rolar. Fora de um Dialog o scroll nativo já funciona normal, por
          // isso só intervimos quando o travamento está de fato ativo.
          if (document.body.hasAttribute('data-scroll-locked')) {
            event.preventDefault()
            event.currentTarget.scrollTop += event.deltaY
          }
          onWheel?.(event)
        }}
        className={cn(
          'z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-0.5 text-sm', className)} {...props} />
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <div data-slot="popover-title" className={cn('font-medium', className)} {...props} />
}

function PopoverDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="popover-description" className={cn('text-muted-foreground', className)} {...props} />
}

export { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger }
