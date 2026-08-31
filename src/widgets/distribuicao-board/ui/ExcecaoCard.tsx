import { useState } from 'react'

import type { Conferente } from '@/entities/conferente'
import type { ProtocoloResumo } from '@/entities/protocolo'
import { useAtribuirManualmente } from '@/features/protocolo/atribuir-manualmente'
import { useDescartarExcecao } from '@/features/protocolo/descartar-excecao'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SurfaceCard } from '@/shared/ui/surface-card'

const ETAPA_LABEL: Record<ProtocoloResumo['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

// RF-17: motivo vem como texto livre (MotorDistribuicao.Motivo — "tipo desconhecido" ou "ninguém
// com alçada", ver dispatch-api/CLAUDE.md), sem uma tag separada como o protótipo simula. "tipo
// novo" dá pra derivar direto; o protótipo também distingue "escala vazia" de "barrado por
// regra" dentro do segundo caso, mas o back não guarda essa diferença — "sem alçada" cobre os
// dois sem inventar um dado que não existe.
const tagDaExcecao = (motivo: string | null) => (motivo === 'tipo desconhecido' ? 'tipo novo' : 'sem alçada')

type ExcecaoCardProps = {
  protocolo: ProtocoloResumo
  conferentes: Conferente[]
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-17 — cada exceção traz o motivo e duas ações: descartar, ou resolver atribuindo na mão a
// um conferente (o motor já disse que não sabe decidir sozinho). "Resolver" abre um seletor
// inline em vez de navegar pra outro lugar — a decisão é rápida, não precisa de tela própria.
export const ExcecaoCard = ({ protocolo, conferentes, onAbrirDetalhe }: ExcecaoCardProps) => {
  const [resolvendo, setResolvendo] = useState(false)
  const [conferenteId, setConferenteId] = useState('')
  const atribuir = useAtribuirManualmente()
  const descartar = useDescartarExcecao()

  const handleConfirmar = () => {
    if (!conferenteId) return
    atribuir.mutate({ protocoloId: protocolo.id, conferenteId }, { onSuccess: () => setResolvendo(false) })
  }

  return (
    <SurfaceCard className="mb-2 cursor-pointer" onClick={() => onAbrirDetalhe(protocolo.id)}>
      <div className="flex items-start justify-between gap-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
            <span className="text-[13px] text-text-5">{ETAPA_LABEL[protocolo.etapa]}</span>
            <Chip tom="atencao">{tagDaExcecao(protocolo.motivoExcecao)}</Chip>
          </div>
          <div className="mt-1 text-[12.5px] leading-snug text-text-2">{protocolo.motivoExcecao}</div>
        </div>

        {!resolvendo && (
          <div className="flex flex-none gap-1.5" onClick={(evento) => evento.stopPropagation()}>
            <Button variant="outline" onClick={() => descartar.mutate(protocolo.id)} disabled={descartar.isPending}>
              Descartar
            </Button>
            <Button onClick={() => setResolvendo(true)}>Resolver</Button>
          </div>
        )}
      </div>

      {resolvendo && (
        <div className="mt-3 flex items-center gap-1.5" onClick={(evento) => evento.stopPropagation()}>
          <Select value={conferenteId} onValueChange={setConferenteId}>
            {/* RNF-10: nome do conferente não trunca — override local (não em shared/ui/select.tsx,
                que outros selects do app usam pra coisa que não é "nome de registro") do
                line-clamp-1/whitespace-nowrap/h-8 fixos do trigger, pra caber um nome de 2 linhas. */}
            <SelectTrigger className="h-auto min-h-8 flex-1 items-start whitespace-normal data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:items-start">
              <SelectValue placeholder="Escolher conferente…" className="text-pretty" />
            </SelectTrigger>
            <SelectContent>
              {conferentes.map((conferente) => (
                <SelectItem key={conferente.id} value={conferente.id}>
                  {conferente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
