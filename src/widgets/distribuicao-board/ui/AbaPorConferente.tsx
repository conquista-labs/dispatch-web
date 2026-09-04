import { NIVEL_LABEL, type Conferente } from '@/entities/conferente'
import type {
  ConcluidosHojePorConferente,
  GrupoPorConferente,
  InfoProtocolo,
  ProtocoloResumo,
} from '@/entities/protocolo'

import { ProtocoloColuna } from './ProtocoloColuna'

type AbaPorConferenteProps = {
  pool: ProtocoloResumo[]
  porConferente: GrupoPorConferente[]
  concluidosHojePorConferente: ConcluidosHojePorConferente[]
  conferentes: Conferente[]
  now: number
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-13/RF-14 — "Pool aberto" + uma coluna por conferente. `porConferente` só traz quem já tem
// algo atribuído; conferentes sem nada aparecem do mesmo jeito (coluna vazia), então a lista
// de colunas vem de entities/conferente, não de porConferente.
export const AbaPorConferente = ({
  pool,
  porConferente,
  concluidosHojePorConferente,
  conferentes,
  now,
  resolverInfo,
  onAbrirDetalhe,
}: AbaPorConferenteProps) => {
  const feitosHojePorConferenteId = new Map(concluidosHojePorConferente.map((c) => [c.conferenteId, c.total]))

  return (
    <div className="flex items-start gap-3 overflow-x-auto">
      <ProtocoloColuna
        nome="Pool aberto"
        sub="sem dono — quem tem alçada para o ato pega"
        protocolos={pool}
        now={now}
        mensagemVazia="pool vazio"
        variant="conferente"
        resolverInfo={resolverInfo}
        onAbrirDetalhe={onAbrirDetalhe}
      />

      {conferentes.map((conferente) => {
        const grupo = porConferente.find((g) => g.conferenteId === conferente.id)
        const feitosHoje = feitosHojePorConferenteId.get(conferente.id)
        const sub = conferente.naEscala
          ? `Analista ${NIVEL_LABEL[conferente.nivel]}${feitosHoje ? ` · ${feitosHoje} feitos hoje` : ''}`
          : 'ausente hoje — não recebe'
        return (
          <ProtocoloColuna
            key={conferente.id}
            // RNF-10: nome completo — dois conferentes com o mesmo primeiro nome ficariam
            // indistinguíveis nesta coluna (a tela mais usada do sistema).
            nome={conferente.nome}
            sub={sub}
            protocolos={grupo?.protocolos ?? []}
            now={now}
            mensagemVazia={conferente.naEscala ? 'fila vazia' : 'ausente'}
            variant="conferente"
            resolverInfo={resolverInfo}
            onAbrirDetalhe={onAbrirDetalhe}
          />
        )
      })}
    </div>
  )
}
