import { SlidersHorizontalIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { DatePicker } from '@/shared/ui/date-picker'
import { Input } from '@/shared/ui/input'

import type { useFiltroProtocolos } from '../model/use-filtro-protocolos'
import { PainelFiltros } from './PainelFiltros'

type BarraDeFiltrosProps = ReturnType<typeof useFiltroProtocolos> & { subtitulo: string }

// "yyyy-mm-dd" (dia local) <-> Date, direto pelos campos locais — sem passar por UTC/ISO no
// meio, senão o dia pode escorregar num fuso horário extremo.
const chaveParaData = (chave: string): Date => {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}
const dataParaChave = (data: Date): string => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

// RF-18e/RF-24f: busca livre + data + botão "Filtros" (abre o painel com os 4 eixos
// combináveis) — antes uma barra fixa com um dropdown por eixo, redesenhada a partir da
// releitura do protótipo (Dispatch.dc.html: `fBusca`/`fData`/`abrirPainelG`, espelhado em
// Minha fila com `qBusca`/`qData`/`abrirPainelQ`). Reaproveitada por Distribuição, Minha fila e
// a fila-do-conferente (visão da distribuidora) — recebe tudo pronto do hook
// useFiltroProtocolos, não sabe de onde os protocolos vieram.
export const BarraDeFiltros = (props: BarraDeFiltrosProps) => {
  const { filtro, setTexto, setData, contagemFiltrosAtivos, subtitulo } = props
  const [painelAberto, setPainelAberto] = useState(false)

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Input
        value={filtro.texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Buscar protocolo, tipo de ato, escrevente, equipe…"
        className="min-w-[220px] flex-1"
      />
      <DatePicker value={filtro.data ? chaveParaData(filtro.data) : null} onChange={(data) => setData(data ? dataParaChave(data) : null)} />
      <button
        type="button"
        onClick={() => setPainelAberto(true)}
        className={cn(
          'flex flex-none items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium',
          contagemFiltrosAtivos > 0 ? 'border-foreground bg-foreground text-background' : 'border-border bg-background hover:border-muted-foreground/40',
        )}
      >
        <SlidersHorizontalIcon className="size-3.5" />
        Filtros
        {contagemFiltrosAtivos > 0 && <span className="font-mono text-[11px] opacity-70">{contagemFiltrosAtivos}</span>}
      </button>

      <PainelFiltros {...props} aberto={painelAberto} onFechar={() => setPainelAberto(false)} subtitulo={subtitulo} />
    </div>
  )
}
