import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type OpcaoMultipla<T> = { valor: T; label: string }

type SeletorMultiploProps<T> = {
  selecionados: T[]
  opcoes: OpcaoMultipla<T>[]
  onAlternar: (valor: T) => void
  placeholder?: string
}

// Dropdown de seleção múltipla com busca — mesmo padrão de FiltroEixo (widgets/filtro-
// protocolos), sem a contagem por opção (não faz sentido aqui, não é filtro sobre dado
// carregado). Padronizado pro alvo do construtor de regra (RF-32): antes era uma parede de
// pills (até 24 tipos de ato de uma vez), inconsistente com o resto do app.
export const SeletorMultiplo = <T,>({ selecionados, opcoes, onAlternar, placeholder = 'buscar…' }: SeletorMultiploProps<T>) => {
  const [busca, setBusca] = useState('')
  const visiveis = busca.trim() ? opcoes.filter((o) => o.label.toLowerCase().includes(busca.trim().toLowerCase())) : opcoes

  const textoTrigger =
    selecionados.length === 0
      ? 'Escolher o que…'
      : selecionados.length === 1
        ? (opcoes.find((o) => o.valor === selecionados[0])?.label ?? '1 selecionado')
        : `${selecionados.length} selecionados`

  return (
    <Popover onOpenChange={(open) => !open && setBusca('')}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-[220px] items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-[12.5px] font-medium hover:border-muted-foreground/40"
        >
          <span className={cn('truncate', selecionados.length === 0 && 'text-muted-foreground')}>{textoTrigger}</span>
          <ChevronDownIcon className="size-3.5 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-[260px] overflow-y-auto p-1">
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={placeholder} className="mb-1 h-7 text-[12.5px]" />
        {visiveis.map((opcao, indice) => {
          const ativo = selecionados.includes(opcao.valor)
          return (
            <button
              key={indice}
              type="button"
              onClick={() => onAlternar(opcao.valor)}
              className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-secondary', ativo && 'bg-secondary')}
            >
              <span className={cn('flex size-3.5 flex-none items-center justify-center rounded border', ativo ? 'border-foreground bg-foreground' : 'border-border')}>
                {ativo && <span className="size-1.5 rounded-full bg-background" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{opcao.label}</span>
            </button>
          )
        })}
        <p className="px-2 py-1 font-mono text-[11px] text-muted-foreground">{visiveis.length} opções</p>
        {visiveis.length === 0 && <p className="px-2 py-1.5 text-[12px] text-muted-foreground">Nada encontrado.</p>}
      </PopoverContent>
    </Popover>
  )
}
