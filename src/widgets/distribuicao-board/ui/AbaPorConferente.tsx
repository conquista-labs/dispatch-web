import type { Conferente } from '@/entities/conferente'
import type { GrupoPorConferente, ProtocoloResumo } from '@/entities/protocolo'

import { ProtocoloColuna } from './ProtocoloColuna'

const NIVEL_LABEL: Record<Conferente['nivel'], string> = {
  Junior: 'Júnior',
  Pleno: 'Pleno',
  Senior: 'Sênior',
}

type AbaPorConferenteProps = {
  pool: ProtocoloResumo[]
  porConferente: GrupoPorConferente[]
  conferentes: Conferente[]
  now: number
}

// RF-13/RF-14 — "Sem dono" + uma coluna por conferente. `porConferente` só traz quem já tem
// algo atribuído; conferentes sem nada aparecem do mesmo jeito (coluna vazia), então a lista
// de colunas vem de entities/conferente, não de porConferente.
export const AbaPorConferente = ({ pool, porConferente, conferentes, now }: AbaPorConferenteProps) => (
  <div className="flex items-start gap-3 overflow-x-auto">
    <ProtocoloColuna nome="Sem dono" sub="exige decisão" protocolos={pool} now={now} mensagemVazia="pool vazio" />

    {conferentes.map((conferente) => {
      const grupo = porConferente.find((g) => g.conferenteId === conferente.id)
      return (
        <ProtocoloColuna
          key={conferente.id}
          nome={conferente.nome.split(' ')[0]}
          sub={conferente.naEscala ? `Analista ${NIVEL_LABEL[conferente.nivel]}` : 'ausente hoje — não recebe'}
          protocolos={grupo?.protocolos ?? []}
          now={now}
          mensagemVazia={conferente.naEscala ? 'fila vazia' : 'ausente'}
        />
      )
    })}
  </div>
)
