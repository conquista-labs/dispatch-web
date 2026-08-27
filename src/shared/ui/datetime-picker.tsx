import { useState } from 'react'

import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type DateTimePickerProps = {
  value: Date
  onChange: (date: Date) => void
}

const formatarData = (data: Date) => data.toLocaleDateString('pt-BR')
const formatarHora = (data: Date) => data.toTimeString().slice(0, 5)

// Substitui o <input type="datetime-local"> nativo (chrome do sistema operacional, não dá pra
// estilizar de verdade — ver conversa com o time de design sobre a tela Importar). Calendar +
// Popover do shadcn pra data, campo de texto simples pra hora.
export const DateTimePicker = ({ value, onChange }: DateTimePickerProps) => {
  const [aberto, setAberto] = useState(false)

  const handleSelecionarData = (data: Date | undefined) => {
    if (!data) return
    const novaData = new Date(data)
    novaData.setHours(value.getHours(), value.getMinutes())
    onChange(novaData)
  }

  const handleAlterarHora = (horaTexto: string) => {
    const [horas, minutos] = horaTexto.split(':').map(Number)
    if (Number.isNaN(horas) || Number.isNaN(minutos)) return
    const novaData = new Date(value)
    novaData.setHours(horas, minutos)
    onChange(novaData)
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start font-normal"
        >
          {formatarData(value)} às {formatarHora(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleSelecionarData} autoFocus />
        <div className="border-t border-border p-2.5">
          <label className="block text-[11px] font-medium text-text-4">Hora</label>
          <input
            type="time"
            value={formatarHora(value)}
            onChange={(event) => handleAlterarHora(event.target.value)}
            className="mt-1 h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground outline-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
