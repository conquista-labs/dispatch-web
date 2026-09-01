import type { Conferente } from '@/entities/conferente'
import type { GrupoPorConferente, InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'

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
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-13/RF-14 — "Pool aberto" + uma coluna por conferente. `porConferente` só traz quem já tem
// algo atribuído; conferentes sem nada aparecem do mesmo jeito (coluna vazia), então a lista
// de colunas vem de entities/conferente, não de porConferente.
//
// Simplificação consciente: sem "· N feitos hoje" no subtítulo (protótipo mostra isso ao lado
// do nível). `ProtocoloResumo` não tem `ConcluidoEm` — só dá pra contar "concluídos" de todo o
// histórico do conferente, não "hoje", e mostrar esse número com o rótulo errado seria pior que
// não mostrar. Fica pra quando o back expuser isso (mesmo padrão do gap que fechamos pra
// `IniciadoEm`/cronômetro em Minha fila).
export const AbaPorConferente = ({ pool, porConferente, conferentes, now, resolverInfo, onAbrirDetalhe }: AbaPorConferenteProps) => (
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
      return (
        <ProtocoloColuna
          key={conferente.id}
          // RNF-10: nome completo — dois conferentes com o mesmo primeiro nome ficariam
          // indistinguíveis nesta coluna (a tela mais usada do sistema).
          nome={conferente.nome}
          sub={conferente.naEscala ? `Analista ${NIVEL_LABEL[conferente.nivel]}` : 'ausente hoje — não recebe'}
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
