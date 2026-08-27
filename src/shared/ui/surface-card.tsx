import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

// O "card" simples do protótipo aprovado (radius 10px, borda + sombra leve) — não é o Card do
// shadcn (esse é mais pesado: ring, --card-spacing, header/footer). Usado por qualquer tela
// que precisa desse cartão específico (protocolo, conferente...), não só Minha fila.
const surfaceCardVariants = cva('rounded-[10px] border bg-card p-3', {
  variants: {
    destaque: {
      false: 'border-border shadow-sm',
      true: 'border-primary shadow',
    },
  },
  defaultVariants: {
    destaque: false,
  },
})

type SurfaceCardProps = React.ComponentProps<'div'> & VariantProps<typeof surfaceCardVariants>

export const SurfaceCard = ({ destaque, className, ...props }: SurfaceCardProps) => (
  <div className={cn(surfaceCardVariants({ destaque }), className)} {...props} />
)
