import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

type PrazoTooltipProps = {
  children: ReactNode
}

// Pedido do dono: explicar o que o chip de prazo significa, no hover — a mesma dúvida se
// repete pra quem olha pela primeira vez ("vence em 3h"/"estourou há 20min" não é óbvio sem
// contexto). Envolve o chip/texto já pronto de cada tela (Minha fila, Distribuição, painel de
// detalhe) em vez de recriar o visual — cada call site decide o que renderizar, isso só
// acrescenta a explicação.
export const PrazoTooltip = ({ children }: PrazoTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>Prazo restante para a conferência deste ato</TooltipContent>
  </Tooltip>
)
