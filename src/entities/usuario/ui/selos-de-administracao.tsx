import { cn } from '@/shared/lib/utils'

// Os dois selos do protótipo aprovado (Dispatch v2) pra quem é Administrador. Moram na entidade
// porque falam do papel, não são peça genérica de UI.

// "SÓ ADMINISTRAÇÃO" — ao lado do que só o admin vê ou mexe (cargo e jornada em Conferentes,
// score no Dashboard), pra ele saber que a distribuidora não enxerga aquilo.
export const SeloSoAdministracao = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-flex flex-none items-center rounded-full border border-border bg-secondary px-1.5 py-px font-mono text-[9.5px] font-medium tracking-[0.05em] whitespace-nowrap text-text-2',
      className,
    )}
  >
    SÓ ADMINISTRAÇÃO
  </span>
)

// "ADMIN" invertido — a sinalização da sessão (RF-48), ao lado do nome no rodapé do menu.
export const SeloAdmin = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'inline-flex flex-none items-center rounded-[4px] bg-foreground px-[5px] py-px font-mono text-[9.5px] font-semibold tracking-[0.05em] text-background',
      className,
    )}
  >
    ADMIN
  </span>
)
