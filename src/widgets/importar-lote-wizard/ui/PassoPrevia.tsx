import { useConferentes } from '@/entities/conferente'
import type { ResumoImportacao } from '@/features/protocolo/importar-lote'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

type PassoPreviaProps = {
  resumo: ResumoImportacao
  onVoltar: () => void
  onConfirmar: () => void
  confirmando: boolean
}

// RF-10: quantos pra cada conferente, quantos pro pool, quantos pra exceção — antes de gravar.
// RF-11: nada foi gravado ainda nesta tela (só a confirmação grava).
export const PassoPrevia = ({ resumo, onVoltar, onConfirmar, confirmando }: PassoPreviaProps) => {
  const { data: conferentes } = useConferentes()
  const nomePorId = new Map((conferentes ?? []).map((c) => [c.id, c.nome]))

  return (
    <div>
      <p className="text-[13.5px] text-text-2">Como o lote ficaria — nada foi gravado ainda.</p>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Resumo label="no arquivo" valor={resumo.totalNoArquivo} />
        <Resumo label="processadas" valor={resumo.processadas} />
        <Resumo label="no pool" valor={resumo.enviadosParaPool} />
        <Resumo label="exceções" valor={resumo.excecoes} tom={resumo.excecoes > 0 ? 'text-warn-fg' : undefined} />
      </div>

      {resumo.atribuidosPorConferente.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {resumo.atribuidosPorConferente.map((atribuicao) => (
            <SurfaceCard key={atribuicao.conferenteId} className="flex items-center justify-between">
              <span className="text-[13.5px] font-medium">{nomePorId.get(atribuicao.conferenteId) ?? 'Conferente'}</span>
              <span className="font-mono text-base font-medium">{atribuicao.quantidade}</span>
            </SurfaceCard>
          ))}
        </div>
      )}

      {resumo.tiposDesconhecidos.length > 0 && (
        <Aviso titulo="Tipos de ato desconhecidos" itens={resumo.tiposDesconhecidos} />
      )}
      {resumo.escreventesSemEquipe.length > 0 && (
        <Aviso titulo="Escreventes sem equipe (prazo padrão D+1)" itens={resumo.escreventesSemEquipe} />
      )}

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

const Resumo = ({ label, valor, tom }: { label: string; valor: number; tom?: string }) => (
  <SurfaceCard>
    <div className="text-[11.5px] font-medium text-text-2">{label}</div>
    <div className={`mt-1 font-mono text-xl font-semibold ${tom ?? ''}`}>{valor}</div>
  </SurfaceCard>
)

const Aviso = ({ titulo, itens }: { titulo: string; itens: string[] }) => (
  <div className="mt-3 rounded-[10px] border border-warn-border bg-warn-bg p-3">
    <div className="text-[12.5px] font-semibold text-warn-fg">{titulo}</div>
    <div className="mt-1 text-[12.5px] text-text-3">{itens.join(' · ')}</div>
  </div>
)
