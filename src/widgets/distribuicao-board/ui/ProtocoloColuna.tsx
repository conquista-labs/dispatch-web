import type { ProtocoloResumo } from '@/entities/protocolo'
import { cn } from '@/shared/lib/utils'

import { DistribuicaoProtocoloCard } from './DistribuicaoProtocoloCard'

type ProtocoloColunaProps = {
  nome: string
  sub?: string
  protocolos: ProtocoloResumo[]
  now: number
  mensagemVazia: string
  /** Nome do dono de cada card — só a aba "Por status" precisa (a coluna já é o dono na aba "Por conferente"). */
  resolverDonoNome?: (protocolo: ProtocoloResumo) => string | null
  /**
   * "conferente": coluna de largura fixa com cabeçalho em card (protótipo, aba "Por conferente").
   * "status": coluna elástica com cabeçalho simples (protótipo, aba "Por status") — 4 colunas
   * dividindo a largura toda, não dá pra fixar em px.
   */
  variant?: 'conferente' | 'status'
  onAbrirDetalhe?: (protocoloId: string) => void
}

// Coluna reaproveitada pelas abas "Por conferente" e "Por status" (RF-13) — mesma estrutura
// (cabeçalho com total, lista de cards, mensagem quando vazia), só muda a largura/cabeçalho e
// quantos cards mostra antes de truncar (protótipo corta em 3 na aba conferente, 4 na de status).
export const ProtocoloColuna = ({ nome, sub, protocolos, now, mensagemVazia, resolverDonoNome, variant = 'conferente', onAbrirDetalhe }: ProtocoloColunaProps) => {
  const maxVisiveis = variant === 'conferente' ? 3 : 4
  const visiveis = protocolos.slice(0, maxVisiveis)
  const restantes = Math.max(0, protocolos.length - maxVisiveis)

  return (
    <div className={cn('flex flex-col gap-2', variant === 'conferente' ? 'w-[206px] flex-none' : 'min-w-0 flex-1')}>
      {variant === 'conferente' ? (
        <div className="rounded-[10px] border border-border bg-card p-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-[13.5px] font-semibold">{nome}</strong>
            <span className="rounded-full bg-secondary px-1.5 py-px font-mono text-[11px] text-text-3">{protocolos.length}</span>
          </div>
          {sub && <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{sub}</div>}
        </div>
      ) : (
        <div className="flex items-center justify-between px-0.5 pb-0.5">
          <strong className="text-[13.5px] font-semibold">{nome}</strong>
          <span className="font-mono text-[11px] text-muted-foreground">{protocolos.length}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {visiveis.map((protocolo) => (
          <DistribuicaoProtocoloCard
            key={protocolo.id}
            protocolo={protocolo}
            now={now}
            donoNome={resolverDonoNome?.(protocolo)}
            variant={variant}
            onAbrirDetalhe={onAbrirDetalhe}
          />
        ))}
        {restantes > 0 && (
          <div className="rounded-[10px] border border-dashed border-border p-2 text-center text-xs text-muted-foreground">+ {restantes} protocolos</div>
        )}
        {protocolos.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{mensagemVazia}</div>
        )}
      </div>
    </div>
  )
}
