import type { useFiltroProtocolos } from '../model/use-filtro-protocolos'
import { FiltroEixo } from './FiltroEixo'

type BarraDeFiltrosProps = ReturnType<typeof useFiltroProtocolos>

// RF-18e/RF-24f: barra fixa acima das colunas, os 4 eixos combináveis entre si + contador de
// filtros ativos + limpar. Reaproveitada por Distribuição e Minha fila — recebe tudo pronto do
// hook useFiltroProtocolos, não sabe de onde os protocolos vieram.
export const BarraDeFiltros = ({ filtro, contagens, contagemFiltrosAtivos, alternarEquipe, alternarTipoAto, alternarPrioridade, alternarFaixaSemaforo, limpar }: BarraDeFiltrosProps) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <FiltroEixo label="Equipe" opcoes={contagens.equipes} selecionados={filtro.equipeIds} onAlternar={alternarEquipe} />
    <FiltroEixo label="Tipo de ato" opcoes={contagens.tiposAto} selecionados={filtro.tipoAtoIds} onAlternar={alternarTipoAto} comBusca />
    <FiltroEixo label="Prioridade" opcoes={contagens.prioridades} selecionados={filtro.prioridades} onAlternar={alternarPrioridade} />
    <FiltroEixo label="Prazo" opcoes={contagens.faixasSemaforo} selecionados={filtro.faixasSemaforo} onAlternar={alternarFaixaSemaforo} />

    {contagemFiltrosAtivos > 0 && (
      <button type="button" onClick={limpar} className="text-[12px] font-medium text-muted-foreground hover:text-foreground">
        {contagemFiltrosAtivos} {contagemFiltrosAtivos > 1 ? 'filtros ativos' : 'filtro ativo'} · limpar
      </button>
    )}
  </div>
)
