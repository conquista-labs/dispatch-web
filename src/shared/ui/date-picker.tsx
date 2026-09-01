import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/lib/utils'

type DatePickerProps = { value: Date | null; onChange: (date: Date | null) => void; placeholder?: string }

const formatarData = (data: Date) => data.toLocaleDateString('pt-BR')

const LETRA_DIA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Substitui o <input type="date"> nativo (RNF-07) — versão sem hora, com valor opcional e
// "Limpar", do DateTimePicker (que exige Date obrigatório com hora/minuto).
export const DatePicker = ({ value, onChange, placeholder = 'Data' }: DatePickerProps) => {
  const [aberto, setAberto] = useState(false)

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-none items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:border-muted-foreground/40"
        >
          <CalendarIcon className="size-3.5 flex-none text-muted-foreground" />
          <span className={cn('font-mono text-[12.5px] font-medium', !value && 'text-muted-foreground')}>{value ? formatarData(value) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(data) => {
            onChange(data ?? null)
            setAberto(false)
          }}
          locale={ptBR}
          formatters={{ formatWeekdayName: (dia) => LETRA_DIA_SEMANA[dia.getDay()] }}
          className="[--cell-size:35px] [&_.rdp-weekday]:font-mono [&_.rdp-weekday]:text-[10px] [&_.rdp-day_button]:font-mono [&_.rdp-day_button]:text-[11.5px]"
        />
        {value && (
          <div className="border-t border-border p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11.5px]"
              onClick={() => {
                onChange(null)
                setAberto(false)
              }}
            >
              Limpar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
