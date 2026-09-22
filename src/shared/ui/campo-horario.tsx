import { Stepper } from '@/shared/ui/stepper'

type CampoHorarioProps = {
  /** "HH:mm" (mesmo formato que o back devolve/aceita pra TimeOnly). */
  value: string
  onChange: (value: string) => void
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

// Par de horas:minutos digitável, sem <input type="time"> nativo (RNF-07) — reaproveita o mesmo
// Stepper do bloco de hora do DateTimePicker, só que sem data/calendário/popover em volta (é um
// horário do dia solto, tipo "corte de horário" de uma Equipe, não um instante completo).
export const CampoHorario = ({ value, onChange }: CampoHorarioProps) => {
  const [horasTexto, minutosTexto] = value.split(':')
  const horas = Number(horasTexto ?? 0)
  const minutos = Number(minutosTexto ?? 0)

  const definir = (campo: 'horas' | 'minutos', valor: number) => {
    const novasHoras = campo === 'horas' ? valor : horas
    const novosMinutos = campo === 'minutos' ? valor : minutos
    onChange(`${doisDigitos(novasHoras)}:${doisDigitos(novosMinutos)}`)
  }

  const mexer = (campo: 'horas' | 'minutos', delta: number) => {
    if (campo === 'horas') definir('horas', (horas + delta + 24) % 24)
    else definir('minutos', (minutos + delta + 60) % 60)
  }

  return (
    <div className="flex items-center gap-2">
      <Stepper
        valor={doisDigitos(horas)}
        min={0}
        max={23}
        onAlterar={(valor) => definir('horas', valor)}
        onDecrementar={() => mexer('horas', -1)}
        onIncrementar={() => mexer('horas', 1)}
      />
      <span className="font-mono text-[12.5px] font-medium text-muted-foreground">:</span>
      <Stepper
        valor={doisDigitos(minutos)}
        min={0}
        max={59}
        onAlterar={(valor) => definir('minutos', valor)}
        onDecrementar={() => mexer('minutos', -1)}
        onIncrementar={() => mexer('minutos', 1)}
      />
    </div>
  )
}
