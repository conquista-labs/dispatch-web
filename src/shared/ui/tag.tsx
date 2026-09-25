import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

// Etiqueta de texto (fonte comum, 10.5px) que convive com o Chip de prazo nos cards. Não é o
// Chip: aquele é mono/11px pra dado tabular (prazo, status) e foi mantido assim de propósito
// (ADR-0016). Os dois tons copiam o protótipo aprovado:
// - critico: a pílula "Alta" (prioridade), vermelha e semibold;
// - neutro: a tag de rodada "↻ 2ª conferência" — borda tracejada e cor de texto secundária, pra
//   não parecer urgência ao lado do "Alta" e do semáforo.
const tagVariants = cva(
  'inline-flex flex-none items-center rounded-full border px-1.5 text-[10.5px] whitespace-nowrap',
  {
    variants: {
      tom: {
        critico: 'border-bad-border bg-bad-bg font-semibold text-bad-fg',
        neutro: 'border-dashed border-text-2 bg-card font-medium text-text-3',
      },
    },
    defaultVariants: {
      tom: 'neutro',
    },
  },
)

type TagProps = React.ComponentProps<'span'> & VariantProps<typeof tagVariants>

export const Tag = ({ tom, className, ...props }: TagProps) => (
  <span className={cn(tagVariants({ tom }), className)} {...props} />
)
