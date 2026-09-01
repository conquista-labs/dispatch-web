import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

import type { useFiltroProtocolos } from '../model/use-filtro-protocolos'
import { FiltroEixo } from './FiltroEixo'

type PainelFiltrosProps = ReturnType<typeof useFiltroProtocolos> & {
  aberto: boolean
  onFechar: () => void
  /** "aplicados às três visões do quadro" (Distribuição) / "aplicados às três colunas da sua
   * fila" (Minha fila) — mesmo texto do protótipo, varia por tela. */
  subtitulo: string
}

const contaLabel = (marcadas: number, total: number) => (marcadas ? `${marcadas} de ${total}` : '')

// RF-18e/RF-24f: painel deslizante com os 4 eixos combináveis, cada um um `FiltroEixo`
// (busca própria, contagem por opção). Espelha `painelAberto`/`painelGrupos` do protótipo
// (Dispatch.dc.html) — antes uma barra fixa inline, agora atrás do botão "Filtros" do toolbar.
export const PainelFiltros = ({
  aberto,
  onFechar,
  subtitulo,
  filtro,
  contagens,
  contagemFiltrosAtivos,
  alternarEquipe,
  alternarTipoAto,
  alternarPrioridade,
  alternarUrgente,
  limpar,
}: PainelFiltrosProps) => (
  <Sheet open={aberto} onOpenChange={(open) => !open && onFechar()}>
    <SheetContent side="right" className="w-[min(360px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-[360px]">
      <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background p-5">
        <SheetTitle className="text-[15px] font-semibold tracking-[-0.01em]">Filtros</SheetTitle>
        <p className="text-[11.5px] text-muted-foreground">{subtitulo}</p>
      </SheetHeader>

      <div className="flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-text-2">Equipe do escrevente</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{contaLabel(filtro.equipeIds.length, contagens.equipes.length)}</span>
          </div>
          <FiltroEixo placeholder="buscar equipe do escrevente…" vazioLabel="todas" opcoes={contagens.equipes} selecionados={filtro.equipeIds} onAlternar={alternarEquipe} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-text-2">Tipo de ato</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{contaLabel(filtro.tipoAtoIds.length, contagens.tiposAto.length)}</span>
          </div>
          <FiltroEixo placeholder="buscar tipo de ato…" vazioLabel="todos" opcoes={contagens.tiposAto} selecionados={filtro.tipoAtoIds} onAlternar={alternarTipoAto} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-text-2">Prioridade</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{contaLabel(filtro.prioridades.length, contagens.prioridades.length)}</span>
          </div>
          <FiltroEixo placeholder="buscar prioridade…" vazioLabel="todas" opcoes={contagens.prioridades} selecionados={filtro.prioridades} onAlternar={alternarPrioridade} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-text-2">Prazo</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{filtro.urgente ? '1 de 1' : ''}</span>
          </div>
          <FiltroEixo
            placeholder="buscar prazo…"
            vazioLabel="todos"
            opcoes={[{ valor: true, label: 'só urgentes e vencendo em 4h', contagem: contagens.urgente }]}
            selecionados={filtro.urgente ? [true] : []}
            onAlternar={alternarUrgente}
          />
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-4">
        <Button variant="outline" className="flex-1 text-[13px]" onClick={limpar}>
          Limpar tudo
        </Button>
        <Button className="flex-1 text-[13px]" onClick={onFechar}>
          {contagemFiltrosAtivos > 0 ? `Ver ${contagemFiltrosAtivos} filtro(s) aplicados` : 'Fechar'}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
)
