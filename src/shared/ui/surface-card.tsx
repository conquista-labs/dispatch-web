import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

// O "card" simples do protótipo aprovado (radius 10px, borda + sombra leve) — não é o Card do
// shadcn (esse é mais pesado: ring, --card-spacing, header/footer). Usado por qualquer tela
// que precisa desse cartão específico (protocolo, conferente...), não só Minha fila.
//
// `tom` pinta o card inteiro pela faixa do semáforo (RF-14: "o semáforo pinta o protocolo em
// toda a interface") — mesmo `tom` do Chip, os dois lêem a mesma faixa. "neutro"/"ok" não tingem
// (o próprio protótipo trata "dentro do prazo" como cor de card normal, só o chip de texto
// muda) — só atenção/crítico/vencido tingem o card inteiro.
//
// `destaque` (card "Em conferência") sempre vence `tom` — é estado de UI ("isso está com você
// agora"), não leitura de prazo. `compoundVariants` garante que a borda/fundo dele ganha de
// qualquer `tom` passado junto, sem depender de ordem de classe no Tailwind.
const surfaceCardVariants = cva('rounded-[10px] border p-3', {
  variants: {
    tom: {
      neutro: 'bg-card border-border',
      ok: 'bg-card border-border',
      atencao: 'bg-warn-bg border-warn-border-2',
      critico: 'bg-crit-bg border-crit-border',
      vencido: 'bg-bad-bg border-bad-border-2',
    },
    destaque: {
      false: 'shadow-sm',
      true: 'shadow',
    },
  },
  compoundVariants: [{ destaque: true, className: 'border-primary! bg-card!' }],
  defaultVariants: {
    tom: 'neutro',
    destaque: false,
  },
})

type SurfaceCardProps = React.ComponentProps<'div'> & VariantProps<typeof surfaceCardVariants>

export const SurfaceCard = ({ tom, destaque, className, ...props }: SurfaceCardProps) => (
  <div className={cn(surfaceCardVariants({ tom, destaque }), className)} {...props} />
)
