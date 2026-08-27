import { useState } from 'react'

import type { Conferente } from '@/entities/conferente'
import type { ProtocoloResumo } from '@/entities/protocolo'
import { useAtribuirManualmente } from '@/features/protocolo/atribuir-manualmente'
import { useDescartarExcecao } from '@/features/protocolo/descartar-excecao'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SurfaceCard } from '@/shared/ui/surface-card'

const ETAPA_LABEL: Record<ProtocoloResumo['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

type ExcecaoCardProps = {
  protocolo: ProtocoloResumo
  conferentes: Conferente[]
}

// RF-17 — cada exceção traz o motivo e duas ações: descartar, ou resolver atribuindo na mão a
// um conferente (o motor já disse que não sabe decidir sozinho). "Resolver" abre um seletor
// inline em vez de navegar pra outro lugar — a decisão é rápida, não precisa de tela própria.
export const ExcecaoCard = ({ protocolo, conferentes }: ExcecaoCardProps) => {
  const [resolvendo, setResolvendo] = useState(false)
  const [conferenteId, setConferenteId] = useState('')
  const atribuir = useAtribuirManualmente()
  const descartar = useDescartarExcecao()

  const handleConfirmar = () => {
    if (!conferenteId) return
    atribuir.mutate({ protocoloId: protocolo.id, conferenteId }, { onSuccess: () => setResolvendo(false) })
  }

  return (
    <SurfaceCard className="mb-2">
      <div className="flex items-start justify-between gap-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
            <span className="text-[13px] text-text-5">{ETAPA_LABEL[protocolo.etapa]}</span>
            <Chip tom="atencao">exceção</Chip>
          </div>
          <div className="mt-1 text-[12.5px] leading-snug text-text-2">{protocolo.motivoExcecao}</div>
        </div>

        {!resolvendo && (
          <div className="flex flex-none gap-1.5">
            <Button variant="outline" onClick={() => descartar.mutate(protocolo.id)} disabled={descartar.isPending}>
              Descartar
            </Button>
            <Button onClick={() => setResolvendo(true)}>Resolver</Button>
          </div>
        )}
      </div>

      {resolvendo && (
        <div className="mt-3 flex items-center gap-1.5">
          <select
            value={conferenteId}
            onChange={(event) => setConferenteId(event.target.value)}
            className="h-8 flex-1 rounded-md border border-border bg-card px-2 text-[12.5px] text-foreground outline-none"
          >
            <option value="">Escolher conferente…</option>
            {conferentes.map((conferente) => (
              <option key={conferente.id} value={conferente.id}>
                {conferente.nome}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setResolvendo(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!conferenteId || atribuir.isPending}>
            Confirmar
          </Button>
        </div>
      )}
    </SurfaceCard>
  )
}
