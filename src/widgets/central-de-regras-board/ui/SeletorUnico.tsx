import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type OpcaoUnica<T> = { valor: T; label: string }

type SeletorUnicoProps<T> = {
  valor: T
  opcoes: OpcaoUnica<T>[]
  onSelecionar: (valor: T) => void
  placeholder?: string
}

// Dropdown de seleção única com busca — mesmo padrão de SeletorConferente (fila-conferentes:
// Popover + trigger + lista com indicador de seleção) somado à busca de FiltroEixo (widgets/
// filtro-protocolos), padronizado aqui pro "Quem" do construtor de regra (RF-32): antes eram
// pills soltas (Júnior/Pleno/Sênior ou um por conferente), inconsistente com o resto do app.
export const SeletorUnico = <T,>({ valor, opcoes, onSelecionar, placeholder = 'buscar…' }: SeletorUnicoProps<T>) => {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const selecionado = opcoes.find((o) => o.valor === valor)
  const visiveis = busca.trim() ? opcoes.filter((o) => o.label.toLowerCase().includes(busca.trim().toLowerCase())) : opcoes

  return (
    <Popover
      open={aberto}
      onOpenChange={(open) => {
        setAberto(open)
        if (!open) setBusca('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-[160px] items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-[12.5px] font-medium hover:border-muted-foreground/40"
        >
          <span className="truncate">{selecionado?.label ?? 'Escolher…'}</span>
          <ChevronDownIcon className="size-3.5 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-[240px] overflow-y-auto p-1">
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={placeholder} className="mb-1 h-7 text-[12.5px]" />
        {visiveis.map((opcao, indice) => {
          const ativo = opcao.valor === valor
          return (
            <button
              key={indice}
              type="button"
              onClick={() => {
                onSelecionar(opcao.valor)
                setAberto(false)
                setBusca('')
              }}
              className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-secondary', ativo && 'bg-secondary')}
            >
              <span className={cn('flex size-3.5 flex-none items-center justify-center rounded-full border', ativo ? 'border-foreground' : 'border-border')}>
                {ativo && <span className="size-1.5 rounded-full bg-foreground" />}
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
