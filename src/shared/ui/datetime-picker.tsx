import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronDownIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

type DateTimePickerProps = { value: Date; onChange: (date: Date) => void }

const formatarData = (data: Date) => data.toLocaleDateString('pt-BR')
const formatarHora = (data: Date) => data.toTimeString().slice(0, 5)
const doisDigitos = (n: number) => String(n).padStart(2, '0')

// Uma letra maiúscula (D S T Q Q S S), igual o protótipo — o `date-fns/locale` sozinho dá 3
// letras minúsculas ("dom", "seg"...).
const LETRA_DIA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

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

  const irParaInicioDoDia = () => {
    const novaData = new Date(value)
    novaData.setHours(0, 0, 0, 0)
    onChange(novaData)
  }

  const irParaAgora = () => onChange(new Date())

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
      <PopoverContent className="w-[266px] p-0" align="start">
        {/* Sem a largura fixa acima, o popover encolhia pro filho mais largo em max-content —
            que por acidente era a linha de botões "Início do dia"/"Agora"/"Pronto", não o
            calendário — sobrando espaço morto assimétrico do lado do calendário (mais estreito)
            e empurrando "Hora"/steppers pras pontas sem dar respiro. 266px é a mesma largura do
            painel equivalente no protótipo aprovado. `[--cell-size:35px]` deixa a grade de dias
            ocupar quase toda essa largura (só ~5px de sobra, contra os ~28px de antes); o
            `flex justify-center` absorve essa sobra igual dos dois lados. */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelecionarData}
            locale={ptBR}
            formatters={{ formatWeekdayName: (dia) => LETRA_DIA_SEMANA[dia.getDay()] }}
            // Protótipo usa JetBrains Mono (número/dado tabular) nos dias e na letra da semana —
            // só o rótulo do mês ("agosto 2026") fica na fonte de texto normal. `[&_.rdp-x]` em vez
            // de `classNames` porque esse prop substitui a classe inteira da chave (perderia o
            // `flex`/tamanho padrão do react-day-picker), só quero acrescentar a fonte.
            className="[--cell-size:35px] [&_.rdp-weekday]:font-mono [&_.rdp-weekday]:text-[10px] [&_.rdp-day_button]:font-mono [&_.rdp-day_button]:text-[11.5px]"
            // Sem autoFocus: ele fazia o react-day-picker pousar o foco de teclado em "hoje" assim
            // que o popover abria, e isso desenha um anel de foco em "hoje" ao mesmo tempo que o
            // preenchimento do dia selecionado aparece em outro dia — duas marcações "concorrentes"
            // lado a lado sem relação com o que o protótipo faz (ele não tem esse conceito).
          />
        </div>
        <div className="flex items-center gap-2 border-t border-border p-2.5">
          <span className="flex-1 text-[11.5px] text-text-2">Hora</span>
          <Stepper valor={doisDigitos(value.getHours())} onDecrementar={() => mexerHora('horas', -1)} onIncrementar={() => mexerHora('horas', 1)} />
          <span className="font-mono text-[12.5px] font-medium text-muted-foreground">:</span>
          <Stepper valor={doisDigitos(value.getMinutes())} onDecrementar={() => mexerHora('minutos', -1)} onIncrementar={() => mexerHora('minutos', 1)} />
        </div>
        <div className="flex gap-1.5 border-t border-border p-2.5">
          <Button variant="outline" size="sm" className="flex-1 text-[11.5px]" onClick={irParaInicioDoDia}>
            Início do dia
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-[11.5px]" onClick={irParaAgora}>
            Agora
          </Button>
          <Button size="sm" className="flex-1 text-[11.5px]" onClick={() => setAberto(false)}>
            Pronto
          </Button>
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
