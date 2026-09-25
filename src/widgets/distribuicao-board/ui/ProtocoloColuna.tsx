import { useState } from 'react'

import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'
import { cn } from '@/shared/lib/utils'

import { DistribuicaoProtocoloCard } from './DistribuicaoProtocoloCard'
import { ListaCompletaColunaSheet } from './ListaCompletaColunaSheet'

type ProtocoloColunaProps = {
  nome: string
  sub?: string
  protocolos: ProtocoloResumo[]
  now: number
  mensagemVazia: string
  /** Nome do dono de cada card — só a aba "Por status" precisa (a coluna já é o dono na aba "Por conferente"). */
  resolverDonoNome?: (protocolo: ProtocoloResumo) => string | null
  /** RF-14: tipo de ato/escrevente/equipe de cada card. */
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  /**
   * "conferente": coluna de largura fixa com cabeçalho em card (protótipo, aba "Por conferente").
   * "status": coluna elástica com cabeçalho simples (protótipo, aba "Por status") — 4 colunas
   * dividindo a largura toda, não dá pra fixar em px.
   */
  variant?: 'conferente' | 'status'
  onAbrirDetalhe?: (protocoloId: string) => void
  /** O painel de detalhe (de qualquer protocolo, de qualquer coluna) está aberto agora? Usado
   * só pra decidir se a lista completa DESTA coluna deve reaparecer sozinha quando o detalhe
   * fechar — ver comentário em ListaCompletaColunaSheet.tsx. */
  detalheAberto?: boolean
  /** Cabeçalho da lista completa ("+N · ver todos"). Padrão: "{nome} · N protocolos". */
  tituloLista?: string
  /** Subtítulo da lista completa — diz o que a lista contém e em que ordem. */
  subtituloLista?: string
}

// Coluna reaproveitada pelas abas "Por conferente" e "Por status" (RF-13) — mesma estrutura
// (cabeçalho com total, lista de cards, mensagem quando vazia), só muda a largura/cabeçalho e
// quantos cards mostra antes de truncar (protótipo corta em 3 na aba conferente, 4 na de status).
export const ProtocoloColuna = ({
  nome,
  sub,
  protocolos,
  now,
  mensagemVazia,
  resolverDonoNome,
  resolverInfo,
  variant = 'conferente',
  onAbrirDetalhe,
  detalheAberto = false,
  tituloLista,
  subtituloLista = 'ordenados por vencimento. Clique para ver o detalhe.',
}: ProtocoloColunaProps) => {
  const maxVisiveis = variant === 'conferente' ? 5 : 4
  const visiveis = protocolos.slice(0, maxVisiveis)
  const restantes = Math.max(0, protocolos.length - maxVisiveis)
  // "O usuário quer ver a lista completa" — não é "a lista está visível agora". Fica `true`
  // mesmo enquanto o painel de detalhe está por cima (a visibilidade real é
  // `listaCompletaAberta && !detalheAberto`, abaixo), pra reaparecer sozinha quando o detalhe
  // fechar, sem perder o lugar.
  const [listaCompletaAberta, setListaCompletaAberta] = useState(false)

  return (
    <div
      className={cn('flex flex-col gap-2', variant === 'conferente' ? 'w-[206px] flex-none' : 'min-w-[220px] flex-1')}
    >
      {variant === 'conferente' ? (
        <div className="rounded-[10px] border border-border bg-card p-2.5 shadow-sm">
          {/* RNF-10: nome completo, sem truncar/cortar pro primeiro nome — dois conferentes
              homônimos (ex.: "Ana Silva"/"Ana Souza") ficariam indistinguíveis nesse cabeçalho.
              items-start (não center) + min-w-0 no nome: com o nome podendo quebrar em mais de
              uma linha, o contador fica alinhado ao topo em vez de centralizado no meio do
              texto, e o texto tem onde encolher antes do contador. */}
          <div className="flex items-start justify-between gap-2">
            <strong className="min-w-0 text-[13.5px] font-semibold text-pretty">{nome}</strong>
            <span className="flex-none rounded-full bg-secondary px-1.5 py-px font-mono text-[11px] text-text-3">
              {protocolos.length}
            </span>
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
            info={resolverInfo(protocolo)}
            variant={variant}
            onAbrirDetalhe={onAbrirDetalhe}
          />
        ))}
        {restantes > 0 && (
          // RF-18c: abre a lista integral da coluna (não só os N ocultos), ordenada por vencimento.
          <button
            type="button"
            onClick={() => setListaCompletaAberta(true)}
            className="rounded-[10px] border border-dashed border-border p-2 text-center text-xs font-medium text-text-2 hover:border-text-2 hover:bg-card hover:text-foreground max-mobile:min-h-11"
          >
            + {restantes} protocolos · ver todos
          </button>
        )}
        {protocolos.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            {mensagemVazia}
          </div>
        )}
      </div>

      {onAbrirDetalhe && (
        <ListaCompletaColunaSheet
          aberto={listaCompletaAberta && !detalheAberto}
          onFechar={() => setListaCompletaAberta(false)}
          titulo={tituloLista ?? `${nome} · ${protocolos.length} protocolos`}
          subtitulo={subtituloLista}
          protocolos={protocolos}
          resolverInfo={resolverInfo}
          now={now}
          onAbrirDetalhe={onAbrirDetalhe}
        />
      )}
    </div>
  )
}
