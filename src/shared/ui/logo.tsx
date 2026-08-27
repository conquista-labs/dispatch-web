import { cn } from '@/shared/lib/utils'

type LogoProps = {
  /**
   * "on-light": crachá escuro, cores via token de tema (sidebar — acompanha claro/escuro).
   * "on-dark-fixed": crachá claro, cores fixas em hex (painel de login — esse painel é sempre
   * escuro, não acompanha o tema do app, então não pode depender de var(--background) etc.).
   */
  variant?: 'on-light' | 'on-dark-fixed'
  size?: 'sm' | 'lg'
  className?: string
}

// Marca do Dispatch — a ampulheta (opção "1d" de ../dispatch-prototype/Logo - opções.dc.html,
// a que foi de fato construída no protótipo aprovado). Dois triângulos empilhados: o de cima
// no tom mais forte (o tempo que resta), o de baixo mais apagado (o que já passou) — a mesma
// ideia do semáforo de prazo, em forma de ícone.
export const Logo = ({ variant = 'on-light', size = 'sm', className }: LogoProps) => {
  const dims = size === 'lg' ? { box: 44, radius: 12, triW: 20, triH: 11, gap: 2.5 } : { box: 26, radius: 7, triW: 12, triH: 6.5, gap: 1.5 }

  const badgeBg = variant === 'on-light' ? 'var(--primary)' : '#fafafa'
  const topTriangle = variant === 'on-light' ? 'var(--background)' : '#09090b'
  const bottomTriangle = variant === 'on-light' ? 'var(--text-3)' : '#a1a1aa'

  return (
    <span
      className={cn('inline-flex flex-none flex-col items-center justify-center', className)}
      style={{
        width: dims.box,
        height: dims.box,
        borderRadius: dims.radius,
        background: badgeBg,
        gap: dims.gap,
      }}
    >
      <span
        style={{
          width: dims.triW,
          height: dims.triH,
          background: topTriangle,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }}
      />
      <span
        style={{
          width: dims.triW,
          height: dims.triH,
          background: bottomTriangle,
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
        }}
      />
    </span>
  )
}
