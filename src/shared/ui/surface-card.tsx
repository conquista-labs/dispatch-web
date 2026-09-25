import { type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'
import { surfaceCardVariants } from '@/shared/ui/surface-card-variants'

type SurfaceCardProps = React.ComponentProps<'div'> & VariantProps<typeof surfaceCardVariants>

export const SurfaceCard = ({ tom, destaque, className, ...props }: SurfaceCardProps) => (
  <div className={cn(surfaceCardVariants({ tom, destaque }), className)} {...props} />
)
