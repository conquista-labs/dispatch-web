import type { Conferente } from '@/entities/conferente'
import type { InfoProtocolo, ProtocoloResumo, VisaoDistribuicao } from '@/entities/protocolo'

import { ProtocoloColuna } from './ProtocoloColuna'

type AbaPorStatusProps = {
  visao: VisaoDistribuicao
  conferentes: Conferente[]
  now: number
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  onAbrirDetalhe: (protocoloId: string) => void
  detalheAberto: boolean
}

// RF-13/RF-14 — Pool, Atribuídos, Em conferência, Concluídos: o mesmo conjunto de protocolos,
// só que agrupado por status em vez de por dono.
export const AbaPorStatus = ({
  visao,
  conferentes,
  now,
  resolverInfo,
  onAbrirDetalhe,
  detalheAberto,
}: AbaPorStatusProps) => {
  // RNF-10: nome completo — dois conferentes com o mesmo primeiro nome ficariam
  // indistinguíveis no card de protocolo (mesmo cuidado de AbaPorConferente.tsx).
  const nomePorConferenteId = new Map(conferentes.map((c) => [c.id, c.nome]))
  const resolverDono = (protocolo: ProtocoloResumo) =>
    protocolo.donoId ? (nomePorConferenteId.get(protocolo.donoId) ?? null) : null

  return (
    // RNF-13 — colunas elásticas (variant="status") tinham só min-w-0 (encolhem até sumir em
    // tela estreita); ganharam um piso (min-w-[220px] em ProtocoloColuna) + overflow-x-auto
    // aqui, mesmo padrão já certo em AbaPorConferente.tsx — rola em vez de espremer.
    <div className="flex items-start gap-3 overflow-x-auto">
      <ProtocoloColuna
        nome="Pool"
        protocolos={visao.pool}
        now={now}
        mensagemVazia="nada no pool"
        resolverDonoNome={resolverDono}
        resolverInfo={resolverInfo}
        variant="status"
        onAbrirDetalhe={onAbrirDetalhe}
        detalheAberto={detalheAberto}
      />
      <ProtocoloColuna
        nome="Atribuídos"
        protocolos={visao.atribuidos}
        now={now}
        mensagemVazia="nada atribuído"
        resolverDonoNome={resolverDono}
        resolverInfo={resolverInfo}
        variant="status"
        onAbrirDetalhe={onAbrirDetalhe}
        detalheAberto={detalheAberto}
      />
      <ProtocoloColuna
        nome="Em conferência"
        protocolos={visao.emConferencia}
        now={now}
        mensagemVazia="ninguém conferindo agora"
        resolverDonoNome={resolverDono}
        resolverInfo={resolverInfo}
        variant="status"
        onAbrirDetalhe={onAbrirDetalhe}
        detalheAberto={detalheAberto}
      />
      <ProtocoloColuna
        nome="Concluídos"
        protocolos={visao.concluidos}
        now={now}
        mensagemVazia="nada concluído"
        resolverDonoNome={resolverDono}
        resolverInfo={resolverInfo}
        variant="status"
        onAbrirDetalhe={onAbrirDetalhe}
        detalheAberto={detalheAberto}
      />
    </div>
  )
}
