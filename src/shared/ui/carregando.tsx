import { Loader2Icon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type CarregandoProps = {
  className?: string
}

// Extraído depois de uma auditoria de qualidade achar essa mesma linha copiada 7 vezes no
// cluster de Central de Regras — mesmo componente usado em outros lugares do app enquanto uma
// query carrega. Era só um `<p>Carregando…</p>` solto, sem ícone nem forma — destoava do
// cabeçalho/abas/botões já renderizados ao redor (o chrome da tela aparece na hora, só o corpo
// virava uma linha de texto perdida — achado real, reportado pelo dono). `Loader2Icon` é o
// mesmo ícone já usado no botão "Redistribuir pool" e no toast do Sonner, reaproveitado aqui em
// vez de introduzir um spinner novo. `className` opcional pra ajustar espaçamento por chamador.
export const Carregando = ({ className }: CarregandoProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground', className)}>
    <Loader2Icon className="size-5 animate-spin" />
    <span className="text-[13px]">Carregando…</span>
  </div>
)
