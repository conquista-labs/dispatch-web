import { INTERVALO_ATUALIZACAO_FILA_MS } from '@/entities/protocolo'
import { useNow } from '@/shared/lib/use-now'

// RF-24i — "atualiza sozinha a cada 30s · última há Ns". Tem o próprio relógio de 1s pra só esta
// linha re-renderizar a cada segundo, não o board inteiro. Com a aba em segundo plano o polling
// pausa, então o número pode passar de um minuto — aí mostra em minutos.
export const IndicadorAtualizacao = ({ atualizadoEm }: { atualizadoEm: number }) => {
  const now = useNow()
  if (!atualizadoEm) return null

  const segundos = Math.max(0, Math.round((now - atualizadoEm) / 1000))
  const ha = segundos < 60 ? `${segundos}s` : `${Math.floor(segundos / 60)}min`

  return (
    <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">
      atualiza sozinha a cada {INTERVALO_ATUALIZACAO_FILA_MS / 1000}s · última há {ha}
    </p>
  )
}
