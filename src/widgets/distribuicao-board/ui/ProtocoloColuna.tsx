import type { ProtocoloResumo } from '@/entities/protocolo'

import { DistribuicaoProtocoloCard } from './DistribuicaoProtocoloCard'

type ProtocoloColunaProps = {
  nome: string
  sub?: string
  protocolos: ProtocoloResumo[]
  now: number
  mensagemVazia: string
  /** Nome do dono de cada card — só a aba "Por status" precisa (a coluna já é o dono na aba "Por conferente"). */
  resolverDonoNome?: (protocolo: ProtocoloResumo) => string | null
}

// Coluna reaproveitada pelas abas "Por conferente" e "Por status" (RF-13) — mesma estrutura
// (cabeçalho com total, lista de cards, mensagem quando vazia), só muda o que populam.
export const ProtocoloColuna = ({ nome, sub, protocolos, now, mensagemVazia, resolverDonoNome }: ProtocoloColunaProps) => (
  <div className="min-w-0 flex-1">
    <div className="px-0.5 pb-0.5">
      <div className="flex items-center justify-between">
        <strong className="text-[13.5px] font-semibold">{nome}</strong>
        <span className="font-mono text-[11px] text-muted-foreground">{protocolos.length}</span>
      </div>
      {sub && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>

    <div className="mt-1.5 flex flex-col gap-2">
      {protocolos.map((protocolo) => (
        <DistribuicaoProtocoloCard key={protocolo.id} protocolo={protocolo} now={now} donoNome={resolverDonoNome?.(protocolo)} />
      ))}
      {protocolos.length === 0 && (
        <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{mensagemVazia}</div>
      )}
    </div>
  </div>
)
