import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

import type { OpcaoContagem } from '../model/use-filtro-protocolos'

type FiltroEixoProps<T> = {
  label: string
  opcoes: OpcaoContagem<T>[]
  selecionados: T[]
  onAlternar: (valor: T) => void
  /** Tipo de ato tem busca própria (39 tipos) — os outros eixos não precisam. */
  comBusca?: boolean
}

// Um dropdown por eixo (equipe/tipo de ato/prioridade/prazo) — multisseleção com contagem por
// opção ao lado (RF-18e: "a gestão sabe o tamanho do recorte antes de aplicar").
export const FiltroEixo = <T,>({ label, opcoes, selecionados, onAlternar, comBusca }: FiltroEixoProps<T>) => {
  const [busca, setBusca] = useState('')
  const opcoesVisiveis = comBusca ? opcoes.filter((o) => o.label.toLowerCase().includes(busca.toLowerCase())) : opcoes

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] font-medium hover:border-muted-foreground/40',
            selecionados.length > 0 && 'border-foreground/30 bg-secondary',
          )}
        >
          {label}
          {selecionados.length > 0 && (
            <span className="rounded-full bg-foreground px-1.5 py-px font-mono text-[10.5px] text-background">{selecionados.length}</span>
          )}
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-[240px] overflow-y-auto p-1">
        {comBusca && (
          <Input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar…"
            className="mb-1 h-7 text-[12.5px]"
          />
        )}
        {opcoesVisiveis.map((opcao, indice) => {
          const ativo = selecionados.includes(opcao.valor)
          return (
            <button
              key={indice}
              type="button"
              onClick={() => onAlternar(opcao.valor)}
              className={cn('flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-secondary', ativo && 'bg-secondary')}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={cn('flex size-3.5 flex-none items-center justify-center rounded border', ativo ? 'border-foreground bg-foreground' : 'border-border')}>
                  {ativo && <span className="size-1.5 rounded-full bg-background" />}
                </span>
                <span className="min-w-0 text-[12.5px] text-pretty">{opcao.label}</span>
              </span>
              <span className="flex-none font-mono text-[11px] text-muted-foreground">{opcao.contagem}</span>
            </button>
          )
        })}
        {opcoesVisiveis.length === 0 && <p className="px-2 py-1.5 text-[12px] text-muted-foreground">Nada encontrado.</p>}
      </PopoverContent>
    </Popover>
  )
}
