import { useState } from 'react'

import { NIVEL_LABEL, type Conferente } from '@/entities/conferente'
import { ETAPA_LABEL, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { useAtribuirManualmente } from '@/features/protocolo/atribuir-manualmente'
import { useDescartarExcecao } from '@/features/protocolo/descartar-excecao'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SeletorUnico } from '@/shared/ui/seletor-unico'
import { SurfaceCard } from '@/shared/ui/surface-card'

// RF-17: motivo vem como texto livre (MotorDistribuicao.Motivo — "tipo desconhecido" ou "ninguém
// com alçada", ver dispatch-api/docs/patterns/motor-e-prazos.md), sem uma tag separada como o
// protótipo simula. "tipo
// novo" dá pra derivar direto; o protótipo também distingue "escala vazia" de "barrado por
// regra" dentro do segundo caso, mas o back não guarda essa diferença — "sem alçada" cobre os
// dois sem inventar um dado que não existe.
const tagDaExcecao = (motivo: string | null) => (motivo === 'tipo desconhecido' ? 'tipo novo' : 'sem alçada')

type ExcecaoCardProps = {
  protocolo: ProtocoloResumo
  conferentes: Conferente[]
  info: InfoProtocolo
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-17 — cada exceção traz o motivo e duas ações: descartar, ou resolver atribuindo na mão a
// um conferente (o motor já disse que não sabe decidir sozinho). "Resolver" abre um seletor
// inline em vez de navegar pra outro lugar — a decisão é rápida, não precisa de tela própria.
export const ExcecaoCard = ({ protocolo, conferentes, info, onAbrirDetalhe }: ExcecaoCardProps) => {
  const [resolvendo, setResolvendo] = useState(false)
  const [conferenteId, setConferenteId] = useState('')
  const atribuir = useAtribuirManualmente()
  const descartar = useDescartarExcecao()
  // Achado numa auditoria de qualidade: as duas mutations disparavam sem tratamento de erro
  // nenhum — se "Resolver"/"Descartar" falhasse, o clique não fazia nada visível. Mesmo padrão
  // de agregação de erro já usado em MinhaFilaBoard.tsx.
  const erro = atribuir.error ?? descartar.error

  const handleConfirmar = () => {
    if (!conferenteId) return
    atribuir.mutate({ protocoloId: protocolo.id, conferenteId }, { onSuccess: () => setResolvendo(false) })
  }

  // RNF-11: mesmo seletor com busca já usado em todo canto que escolhe um conferente/tipo/
  // equipe (ex.: ProtocoloManualDialog) — o Select puro do shadcn (sem busca) destoava do
  // resto do app (achado pelo dono comparando os dois lado a lado).
  const conferenteOpcoes = conferentes.map((c) => ({ valor: c.id, label: c.nome, sub: NIVEL_LABEL[c.nivel] }))

  return (
    <SurfaceCard className="mb-2 cursor-pointer" onClick={() => onAbrirDetalhe(protocolo.id)}>
      <div className="flex items-start justify-between gap-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
            <span className="text-[13px] text-text-5">{ETAPA_LABEL[protocolo.etapa]}</span>
            <Chip tom="atencao">{tagDaExcecao(protocolo.motivoExcecao)}</Chip>
          </div>
          {/* RF-14: tipo de ato + escrevente/equipe — mesmo dado dos outros cards de protocolo. */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-text-2">
            <span className="text-pretty">{info.tipoAtoNome ?? '—'}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-pretty">{info.escreventeNome ?? '—'}</span>
            <Chip tom={info.equipeNome ? 'neutro' : 'vencido'} fonte="padrao" className="font-medium">
              {info.equipeNome ?? 'sem equipe'}
            </Chip>
          </div>
          <div className="mt-1 text-[12.5px] leading-snug text-text-2">{protocolo.motivoExcecao}</div>
          {erro && (
            <div className="mt-1.5 text-[12.5px] text-bad-fg">Não foi possível concluir a ação. Tente de novo.</div>
          )}
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
          <SeletorUnico
            valor={conferenteId}
            opcoes={conferenteOpcoes}
            onSelecionar={setConferenteId}
            placeholder="buscar conferente…"
          />
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
