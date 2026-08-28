import { ETAPA_LABEL, type Etapa } from '@/entities/protocolo'
import { useConferentes } from '@/entities/conferente'
import type { ResumoImportacao } from '@/features/protocolo/importar-lote'
import { formatDataHora } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

type PassoPreviaProps = {
  resumo: ResumoImportacao
  etapa: Etapa
  linhaDeCorte: string
  onVoltar: () => void
  onConfirmar: () => void
  confirmando: boolean
}

// RF-10: pra onde cada protocolo vai (pool aberto, fila de exceções ou um conferente
// específico) — mesma lista, uma linha por destino, igual o protótipo aprovado (não são cards
// de contagem separados; "Pool aberto"/"Fila de exceções" entram como itens da lista, ao lado
// dos conferentes, cada um com sua "sub" explicando o porquê). RF-11: nada foi gravado ainda.
export const PassoPrevia = ({ resumo, etapa, linhaDeCorte, onVoltar, onConfirmar, confirmando }: PassoPreviaProps) => {
  const { data: conferentes } = useConferentes()
  const nomePorId = new Map((conferentes ?? []).map((c) => [c.id, c.nome]))
  const nivelPorId = new Map((conferentes ?? []).map((c) => [c.id, c.nivel]))

  const destinos = [
    ...(resumo.enviadosParaPool > 0 ? [{ chave: 'pool', nome: 'Pool aberto', sub: 'quem tiver alçada pega', qtd: resumo.enviadosParaPool }] : []),
    ...(resumo.excecoes > 0 ? [{ chave: 'excecoes', nome: 'Fila de exceções', sub: 'exige decisão sua', qtd: resumo.excecoes }] : []),
    ...resumo.atribuidosPorConferente.map((atribuicao) => ({
      chave: atribuicao.conferenteId,
      nome: nomePorId.get(atribuicao.conferenteId) ?? 'Conferente',
      sub: `Analista ${nivelPorId.get(atribuicao.conferenteId) ?? 'Pleno'}`,
      qtd: atribuicao.quantidade,
    })),
  ].sort((a, b) => b.qtd - a.qtd)

  return (
    <div>
      <p className="mb-1 font-mono text-xs font-medium text-muted-foreground">
        {resumo.processadas} linhas · {ETAPA_LABEL[etapa]} · a partir de {formatDataHora(linhaDeCorte)}
      </p>
      <p className="mb-3.5 text-[13.5px] text-text-2">Como o lote ficaria — nada foi gravado ainda.</p>

      <div className="grid grid-cols-2 gap-2">
        {destinos.map((destino) => (
          <SurfaceCard key={destino.chave} className="flex items-center justify-between gap-2.5 p-3.5 px-4">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium">{destino.nome}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{destino.sub}</div>
            </div>
            <span className="shrink-0 font-mono text-base font-medium">{destino.qtd}</span>
          </SurfaceCard>
        ))}
      </div>

      {resumo.tiposDesconhecidos.length > 0 && <Aviso titulo="Tipos de ato que o sistema não conhece" itens={resumo.tiposDesconhecidos} />}
      {resumo.escreventesSemEquipe.length > 0 && <Aviso titulo="Escreventes sem equipe (prazo padrão D+1)" itens={resumo.escreventesSemEquipe} />}

      <div className="mt-5 flex justify-between">
        <Button variant="outline" onClick={onVoltar} disabled={confirmando}>
          Voltar
        </Button>
        <Button onClick={onConfirmar} disabled={confirmando}>
          {confirmando ? 'Confirmando…' : 'Confirmar e distribuir'}
        </Button>
      </div>
    </div>
  )
}

const Aviso = ({ titulo, itens }: { titulo: string; itens: string[] }) => (
  <div className="mt-3 rounded-[10px] border border-warn-border bg-warn-bg p-3">
    <div className="text-[12.5px] font-semibold text-warn-fg">{titulo}</div>
    <div className="mt-1 text-[12.5px] text-text-3">{itens.join(' · ')}</div>
  </div>
)
