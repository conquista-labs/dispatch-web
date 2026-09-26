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
      // 'mono' (default) é o padrão de sempre (prazo — 11px JetBrains Mono, bate com o
      // protótipo). 'padrao' é pra pills de equipe/etapa, que no protótipo usam a fonte de texto
      // em 10.5px; 'sans' é pro status de resultado (Aprovado/Não aprovado), sans 11px com mais
      // respiro. As duas precisam do `font-sans` explícito: `font-normal` é peso, não família, e
      // sem ele o `font-mono` da base sobrevivia ao twMerge (as pills saíam em JetBrains Mono).
      fonte: {
        mono: '',
        padrao: 'font-sans font-normal text-[10.5px]',
        sans: 'px-2 font-sans',
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
