import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronDownIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type DateTimePickerProps = { value: Date; onChange: (date: Date) => void }

const formatarData = (data: Date) => data.toLocaleDateString('pt-BR')
const formatarHora = (data: Date) => data.toTimeString().slice(0, 5)
const doisDigitos = (n: number) => String(n).padStart(2, '0')

// Substitui o <input type="datetime-local"> nativo (chrome do sistema operacional, não dá pra
// estilizar de verdade). Gatilho e o painel de hora seguem o protótipo aprovado (Dispatch.dc.html,
// passo "Linha de corte"): botão com ícone + data · hora, calendário com steppers −/+ pra hora e
// minuto em vez de um segundo input nativo.
export const DateTimePicker = ({ value, onChange }: DateTimePickerProps) => {
  const [aberto, setAberto] = useState(false)

  const handleSelecionarData = (data: Date | undefined) => {
    if (!data) return
    const novaData = new Date(data)
    novaData.setHours(value.getHours(), value.getMinutes())
    onChange(novaData)
  }

  const mexerHora = (campo: 'horas' | 'minutos', delta: number) => {
    const novaData = new Date(value)
    if (campo === 'horas') novaData.setHours(novaData.getHours() + delta)
    else novaData.setMinutes(novaData.getMinutes() + delta)
    onChange(novaData)
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:border-muted-foreground/40"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarIcon className="size-3.5 flex-none text-muted-foreground" />
            <span className="truncate font-mono text-[13.5px] font-medium">
              {formatarData(value)} · {formatarHora(value)}
            </span>
          </span>
          <ChevronDownIcon className="size-4 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleSelecionarData} locale={ptBR} autoFocus />
        <div className="flex items-center gap-2 border-t border-border p-2.5">
          <span className="flex-1 text-[11.5px] text-text-2">Hora</span>
          <Stepper valor={doisDigitos(value.getHours())} onDecrementar={() => mexerHora('horas', -1)} onIncrementar={() => mexerHora('horas', 1)} />
          <span className="font-mono text-[12.5px] font-medium text-muted-foreground">:</span>
          <Stepper valor={doisDigitos(value.getMinutes())} onDecrementar={() => mexerHora('minutos', -1)} onIncrementar={() => mexerHora('minutos', 1)} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

const Stepper = ({ valor, onDecrementar, onIncrementar }: { valor: string; onDecrementar: () => void; onIncrementar: () => void }) => (
  <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
    <button type="button" onClick={onDecrementar} className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary">
      <MinusIcon className="size-3" />
    </button>
    <span className="min-w-[22px] text-center font-mono text-[12.5px] font-medium">{valor}</span>
    <button type="button" onClick={onIncrementar} className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary">
      <PlusIcon className="size-3" />
    </button>
  </div>
)
