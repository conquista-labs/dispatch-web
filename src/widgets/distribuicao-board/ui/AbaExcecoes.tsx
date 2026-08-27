import type { Conferente } from '@/entities/conferente'
import type { ProtocoloResumo } from '@/entities/protocolo'

import { ExcecaoCard } from './ExcecaoCard'

type AbaExcecoesProps = {
  excecoes: ProtocoloResumo[]
  conferentes: Conferente[]
}

// RF-17.
export const AbaExcecoes = ({ excecoes, conferentes }: AbaExcecoesProps) => {
  if (excecoes.length === 0) {
    return (
      <div className="max-w-[780px] rounded-xl border border-dashed border-border bg-card p-10 text-center text-[13.5px] text-muted-foreground">
        Nenhuma exceção pendente. Tudo o que entrou foi distribuído.
      </div>
    )
  }

  return (
    <div className="max-w-[780px]">
      {excecoes.map((protocolo) => (
        <ExcecaoCard key={protocolo.id} protocolo={protocolo} conferentes={conferentes} />
      ))}
    </div>
  )
}
