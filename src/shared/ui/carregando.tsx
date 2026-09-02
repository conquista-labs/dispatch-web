import { cn } from '@/shared/lib/utils'

type CarregandoProps = {
  className?: string
}

// Extraído depois de uma auditoria de qualidade achar essa mesma linha copiada 7 vezes no
// cluster de Central de Regras (com um `mt-5` inconsistente em algumas cópias) — mesmo texto/
// classe usado em outros lugares do app enquanto uma query carrega. `className` opcional pra
// cada chamador manter o espaçamento que já tinha (o objetivo aqui é parar de duplicar o
// markup, não mudar layout de ninguém).
export const Carregando = ({ className }: CarregandoProps) => <p className={cn('text-[13.5px] text-muted-foreground', className)}>Carregando…</p>
