import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

// Pílula pequena (prazo, status) — usada em qualquer tela que mostra o semáforo (RF-14) ou um
// resultado (aprovado/reprovado). `cva` em vez de um objeto de classe + template literal: a
// tabela variante→classe fica num lugar só, documentada, igual o Button do shadcn já faz.
const chipVariants = cva(
  'inline-flex items-center rounded-full border px-1.5 py-px font-mono text-[11px] font-medium whitespace-nowrap',
  {
    variants: {
      tom: {
        neutro: 'border-border bg-secondary text-muted-foreground',
        ok: 'border-ok-border bg-ok-bg text-ok-fg',
        atencao: 'border-warn-border bg-warn-bg-2 text-warn-fg',
        critico: 'border-crit-border bg-crit-bg-2 text-crit-fg',
        vencido: 'border-bad-border-2 bg-bad-bg-2 text-bad-fg',
      },
      // 'mono' (default) é o padrão de sempre (prazo/status — 11px JetBrains Mono, bate com o
      // protótipo). 'padrao' é pra pills de equipe/etapa especificamente, que no protótipo usam
      // a fonte de texto comum em 10.5px, não mono (achado num backlog de fidelidade visual) —
      // twMerge (via `cn`) resolve o conflito de font-mono/text-[11px] vs. font-normal/
      // text-[10.5px] no momento em que o componente aplica `className`.
      fonte: {
        mono: '',
        padrao: 'font-normal text-[10.5px]',
      },
    },
    defaultVariants: {
      tom: 'neutro',
      fonte: 'mono',
    },
  },
)

type ChipProps = React.ComponentProps<'span'> & VariantProps<typeof chipVariants>

export const Chip = ({ tom, fonte, className, ...props }: ChipProps) => (
  <span className={cn(chipVariants({ tom, fonte }), className)} {...props} />
)
