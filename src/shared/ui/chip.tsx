import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

// Pílula pequena (prazo, status) — usada em qualquer tela que mostra o semáforo (RF-14) ou um
// resultado (aprovado/reprovado). `cva` em vez de um objeto de classe + template literal: a
// tabela variante→classe fica num lugar só, documentada, igual o Button do shadcn já faz.
const chipVariants = cva('inline-flex items-center rounded-full border px-1.5 py-px font-mono text-[11px] font-medium whitespace-nowrap', {
  variants: {
    tom: {
      neutro: 'border-border bg-secondary text-muted-foreground',
      ok: 'border-ok-border bg-ok-bg text-ok-fg',
      atencao: 'border-warn-border bg-warn-bg-2 text-warn-fg',
      critico: 'border-crit-border bg-crit-bg-2 text-crit-fg',
      vencido: 'border-bad-border-2 bg-bad-bg-2 text-bad-fg',
    },
  },
  defaultVariants: {
    tom: 'neutro',
  },
})

type ChipProps = React.ComponentProps<'span'> & VariantProps<typeof chipVariants>

export const Chip = ({ tom, className, ...props }: ChipProps) => <span className={cn(chipVariants({ tom }), className)} {...props} />
