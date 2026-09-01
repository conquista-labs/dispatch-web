import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

import type { OpcaoContagem } from '../model/use-filtro-protocolos'

type FiltroEixoProps<T> = {
  placeholder: string
  vazioLabel: string
  opcoes: OpcaoContagem<T>[]
  selecionados: T[]
  onAlternar: (valor: T) => void
}

// Ignora acento na busca (RNF-11) — mesma normalização do `Combo` do protótipo
// (Combo.dc.html, função `norm`: NFD + remove marcas diacríticas).
const semAcento = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// Seletor com busca (RNF-11: "todo campo cujo conjunto de opções cresce... usa um seletor com
// busca... nunca uma faixa de chips") — gatilho compacto mostrando a seleção atual, popover com
// busca (ignora acento), lista rolável com marcação, contagem de opções e "Limpar" na
// multisseleção. Espelha o componente `Combo` do protótipo (Combo.dc.html), um por eixo dentro
// do painel "Filtros" (ver PainelFiltros.tsx).
export const FiltroEixo = <T,>({ placeholder, vazioLabel, opcoes, selecionados, onAlternar }: FiltroEixoProps<T>) => {
  const [busca, setBusca] = useState('')
  const q = semAcento(busca.trim())
  const opcoesVisiveis = q ? opcoes.filter((o) => semAcento(o.label).includes(q)) : opcoes
  const marcadas = opcoes.filter((o) => selecionados.includes(o.valor))
  const rotulo = marcadas.length === 0 ? vazioLabel : marcadas.length === 1 ? marcadas[0].label : `${marcadas.length} selecionados`

  return (
    <Popover onOpenChange={(open) => !open && setBusca('')}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:border-muted-foreground/40"
        >
          <span className={cn('flex-1 truncate text-[12.5px] font-medium', marcadas.length === 0 && 'text-muted-foreground')}>{rotulo}</span>
          <ChevronDownIcon className="size-3.5 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[248px] p-0">
        <div className="border-b border-border p-1.5">
          <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={placeholder} className="h-7 text-[12.5px]" />
        </div>
        <div className="max-h-[236px] overflow-y-auto p-1">
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
          {opcoesVisiveis.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">nada encontrado</p>}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-2.5 py-1.5">
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {opcoes.length} {opcoes.length === 1 ? 'opção' : 'opções'}
            {q && ` · ${opcoesVisiveis.length} na busca`}
          </span>
          {marcadas.length > 0 && (
            <button type="button" onClick={() => marcadas.forEach((o) => onAlternar(o.valor))} className="text-[11.5px] font-medium text-text-2 hover:text-foreground">
              Limpar
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
