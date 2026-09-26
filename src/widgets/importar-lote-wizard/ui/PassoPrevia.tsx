import { ETAPA_LABEL, type Etapa } from '@/entities/protocolo'
import { rotuloAnalista, useConferentes } from '@/entities/conferente'
import type { ResumoImportacao } from '@/features/protocolo/importar-lote'
import { formatDataHora } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
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
    ...(resumo.enviadosParaPool > 0
      ? [{ chave: 'pool', nome: 'Pool aberto', sub: 'quem tiver alçada pega', qtd: resumo.enviadosParaPool }]
      : []),
    ...(resumo.excecoes > 0
      ? [{ chave: 'excecoes', nome: 'Fila de exceções', sub: 'exige decisão sua', qtd: resumo.excecoes }]
      : []),
    ...resumo.atribuidosPorConferente.map((atribuicao) => ({
      chave: atribuicao.conferenteId,
      nome: nomePorId.get(atribuicao.conferenteId) ?? 'Conferente',
      // Nível só vem pro Administrador; sem ele, sem cargo inventado (antes caía num 'Pleno' fixo).
      sub: rotuloAnalista(nivelPorId.get(atribuicao.conferenteId) ?? null) ?? 'conferente',
      qtd: atribuicao.quantidade,
    })),
  ].sort((a, b) => b.qtd - a.qtd)

  // Quantas linhas novas de cada escrevente sem equipe — sai das próprias linhas da prévia (a
  // lista `escreventesSemEquipe` do back só traz os nomes). A de cada tipo desconhecido vem pronta
  // do back (`tiposDesconhecidosContagem`): o nome da linha pode vir sem acento e o da lista com.
  const linhasSemEquipe = (resumo.linhas ?? []).filter((l) => !l.jaExiste && !l.equipe)
  const semEquipe = resumo.escreventesSemEquipe.map((nome) => {
    const qtd = linhasSemEquipe.filter(
      (l) => l.escrevente.localeCompare(nome, 'pt-BR', { sensitivity: 'base' }) === 0,
    ).length
    return qtd > 0 ? `${nome} · ${qtd}` : nome
  })
  const tiposNovos = resumo.tiposDesconhecidosContagem
    ? resumo.tiposDesconhecidosContagem.map((t) => `${t.nome} · ${t.quantidade}`)
    : resumo.tiposDesconhecidos

  return (
    <div>
      <p className="mb-1 font-mono text-xs font-medium text-muted-foreground">
        {resumo.processadas} linhas · {ETAPA_LABEL[etapa]} · a partir de {formatDataHora(linhaDeCorte)}
      </p>
      <p className="mb-3.5 text-[13.5px] text-text-2">Como o lote ficaria — nada foi gravado ainda.</p>

      <div className="grid grid-cols-2 gap-2 max-mobile:grid-cols-1">
        {destinos.map((destino) => (
          // RNF-10: nome do destino não trunca — items-start (não center) porque o nome agora
          // pode quebrar em mais de uma linha, e a contagem ganha mt-0.5 pra ficar alinhada
          // com a primeira linha, não com o meio de um bloco que pode ter 1 ou 2 linhas.
          <SurfaceCard key={destino.chave} className="flex items-start justify-between gap-2.5 px-3.5 py-3">
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-pretty">{destino.nome}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{destino.sub}</div>
            </div>
            <span className="mt-0.5 shrink-0 font-mono text-base font-medium">{destino.qtd}</span>
          </SurfaceCard>
        ))}
      </div>

      {/* Texto fiel ao back, não ao protótipo: lá o tipo desconhecido "vai para a fila de exceções";
          aqui a confirmação cadastra o tipo no catálogo e ele distribui pela alçada que já vale
          (dispatch-api ADR-0012) — o que a distribuidora precisa é conferir alçada e peso dele. */}
      {tiposNovos.length > 0 && (
        <Aviso
          tom="bad"
          titulo="Tipos de ato que o sistema não conhece"
          orientacao="Entram no catálogo ao confirmar e distribuem pela alçada que já vale para eles. Confira a alçada e o peso de complexidade em Central de regras · Tipos de ato."
          itens={tiposNovos}
        />
      )}
      {semEquipe.length > 0 && (
        <Aviso
          tom="warn"
          titulo="Escreventes sem equipe"
          orientacao="Entram com o prazo padrão D+1, não com o prazo do setor. Aloque em Central de regras · Prazos por equipe."
          itens={semEquipe}
        />
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

const TOM_AVISO = {
  bad: { caixa: 'border-bad-border bg-bad-bg', titulo: 'text-bad-fg', pilula: 'border-bad-border' },
  warn: { caixa: 'border-warn-border bg-warn-bg', titulo: 'text-warn-fg', pilula: 'border-warn-border' },
} as const

// Bloco de aviso do protótipo v2: título, uma frase dizendo o que fazer, e cada item numa pílula.
const Aviso = ({
  tom,
  titulo,
  orientacao,
  itens,
}: {
  tom: keyof typeof TOM_AVISO
  titulo: string
  orientacao: string
  itens: string[]
}) => (
  <div className={cn('mt-2 rounded-[10px] border px-[15px] py-[13px]', TOM_AVISO[tom].caixa)}>
    <div className={cn('text-[13px] font-semibold', TOM_AVISO[tom].titulo)}>{titulo}</div>
    <div className="mt-[3px] text-[12px] text-text-2">{orientacao}</div>
    <div className="mt-[9px] flex flex-wrap gap-[5px]">
      {itens.map((item) => (
        <span
          key={item}
          className={cn(
            'rounded-full border bg-card px-[9px] py-0.5 text-[11.5px] font-medium text-foreground',
            TOM_AVISO[tom].pilula,
          )}
        >
          {item}
        </span>
      ))}
    </div>
  </div>
)
