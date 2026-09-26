import { type ReactNode, useState } from 'react'

import { useIsMobile } from '@/shared/lib/use-is-mobile'
import { cn } from '@/shared/lib/utils'

import type { AbaDaFila } from '../lib/prioridade-alta'

type Aba = AbaDaFila

type FilaColunasProps = {
  pool: ReactNode
  poolTotal: number
  minhas: ReactNode
  minhasTotal: number
  conferencia: ReactNode
  conferenciaTotal: number
  /** Aba controlada de fora (opcional): o board troca a aba quando o "Ver" da faixa de prioridade
   * alta aponta pra um card de outra aba (RF-24j). Sem isso, a aba é estado interno. */
  abaAtiva?: Aba
  onAbaAtivaChange?: (aba: Aba) => void
}

// RF-24g — no desktop as 3 colunas ficam sempre lado a lado (comportamento de sempre); abaixo
// de 760px viram abas (Pool/Minhas/Conferência, com contador), só a ativa renderiza — confirmado
// navegando o protótipo aprovado de verdade. O rótulo mais longo de cada coluna ("Pool
// disponível", "Atribuídas a você"...) continua dentro do corpo de cada uma, sem duplicar aqui;
// a aba usa só o nome curto. Reaproveitado por MinhaFilaBoard e FilaDoConferenteBoard.
export const FilaColunas = ({
  pool,
  poolTotal,
  minhas,
  minhasTotal,
  conferencia,
  conferenciaTotal,
  abaAtiva: abaControlada,
  onAbaAtivaChange,
}: FilaColunasProps) => {
  const mobile = useIsMobile()
  const [abaInterna, setAbaInterna] = useState<Aba>('pool')
  const abaAtiva = abaControlada ?? abaInterna
  const setAbaAtiva = (aba: Aba) => {
    setAbaInterna(aba)
    onAbaAtivaChange?.(aba)
  }

  if (!mobile) {
    return (
      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">{pool}</div>
        <div className="min-w-0 flex-1">{minhas}</div>
        <div className="min-w-0 flex-1">{conferencia}</div>
      </div>
    )
  }

  const abas: { valor: Aba; label: string; total: number; conteudo: ReactNode }[] = [
    { valor: 'pool', label: 'Pool', total: poolTotal, conteudo: pool },
    { valor: 'minhas', label: 'Minhas', total: minhasTotal, conteudo: minhas },
    { valor: 'conferencia', label: 'Conferência', total: conferenciaTotal, conteudo: conferencia },
  ]

  return (
    <div className="mt-4">
      {/* Abas na largura toda, 44px de alvo, contador em mono à parte (protótipo v2, RF-24g). */}
      <div className="flex gap-0.5 rounded-[10px] bg-secondary p-1">
        {abas.map((aba) => {
          const ativa = abaAtiva === aba.valor
          return (
            <button
              key={aba.valor}
              type="button"
              onClick={() => setAbaAtiva(aba.valor)}
              className={cn(
                'flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted-foreground',
                ativa && 'bg-card text-foreground shadow-sm',
              )}
            >
              {aba.label}
              <span className={cn('font-mono text-[11px]', ativa ? 'text-text-2' : 'text-apoio')}>{aba.total}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3">{abas.find((aba) => aba.valor === abaAtiva)?.conteudo}</div>
    </div>
  )
}
