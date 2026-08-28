import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import type { Etapa } from '@/entities/protocolo'
import { parseCsv } from '@/shared/lib/parse-csv'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { DateTimePicker } from '@/shared/ui/datetime-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { SurfaceCard } from '@/shared/ui/surface-card'

// Mesmo default do protótipo aprovado (`impCorte`, Dispatch.dc.html): hoje às 00:00, não "bem
// no passado". Um default muito antigo (o que este componente tinha antes) somado à falta de
// digitação no seletor (ver DateTimePicker) fazia a linha de corte nunca filtrar nada de fato:
// o usuário mexia só na hora/minuto via stepper e a *data* ficava esquecida anos atrás, então
// toda linha do relatório (sempre "hoje") passava no filtro `> linhaDeCorte` de qualquer jeito.
const inicioDeHoje = () => {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  return data
}

const OPCOES_ETAPA: { valor: Etapa; label: string; sub: string }[] = [
  { valor: 'PreConferencia', label: 'Pré-conferência', sub: 'antes da lavratura — leitura da minuta' },
  { valor: 'PosConferencia', label: 'Pós-conferência', sub: 'depois da lavratura' },
]

// Trigger de duas linhas (rótulo + explicação) + popover com as duas opções, igual o protótipo
// aprovado — o <select> nativo não tem como mostrar a segunda linha dentro do próprio campo.
const SeletorEtapa = ({ value, onChange }: { value: Etapa; onChange: (valor: Etapa) => void }) => {
  const [aberto, setAberto] = useState(false)
  const selecionada = OPCOES_ETAPA.find((o) => o.valor === value)!

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:border-muted-foreground/40"
        >
          <span className="min-w-0">
            <span className="block text-[13.5px] font-medium">{selecionada.label}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{selecionada.sub}</span>
          </span>
          <ChevronDownIcon className="size-4 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1">
        {OPCOES_ETAPA.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => {
              onChange(opcao.valor)
              setAberto(false)
            }}
            className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-secondary', opcao.valor === value && 'bg-secondary')}
          >
            <span
              className={cn(
                'flex size-3.5 flex-none items-center justify-center rounded-full border',
                opcao.valor === value ? 'border-foreground' : 'border-border',
              )}
            >
              {opcao.valor === value && <span className="size-1.5 rounded-full bg-foreground" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">{opcao.label}</span>
              <span className="block text-[11px] text-muted-foreground">{opcao.sub}</span>
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

type PassoDadosProps = {
  onContinuar: (dados: { etapa: Etapa; linhaDeCorte: string; texto: string }) => void
  carregando: boolean
  erro: string | null
}

// RF-05/RF-06: arquivo de verdade (.csv/.xlsx) fica pra depois — colar linhas já cobre o RF,
// e é como o dono testou a importação a sessão inteira. RF-07: a "linha de corte" evita
// reimportar o que já foi processado (ver CLAUDE.md do dispatch-api) — pré-preenchida em
// "hoje 00:00" (mesmo default do protótipo aprovado). Sem o botão "Usar relatório
// de exemplo" do protótipo — lá ele gera dado fake local (ferramenta de design); aqui não tem
// sentido, o CSV vem de verdade do cartório. O resto do rodapé segue o protótipo: contador
// "N linhas coladas" e o botão de avançar leva a contagem no texto.
export const PassoDados = ({ onContinuar, carregando, erro }: PassoDadosProps) => {
  const [etapa, setEtapa] = useState<Etapa>('PreConferencia')
  const [linhaDeCorte, setLinhaDeCorte] = useState(inicioDeHoje)
  const [texto, setTexto] = useState('')
  const qtdColadas = texto.trim() ? parseCsv(texto).length : 0

  return (
    <div>
      <p className="mb-4 max-w-[70ch] text-[13.5px] text-text-2">
        Duas informações não vêm no arquivo e precisam ser declaradas antes: a etapa do lote e a partir de quando processar.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <SurfaceCard className="p-3.5 px-4">
          <div className="text-[12.5px] font-medium text-text-3">Etapa do relatório</div>
          <div className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground">o lote inteiro é pré ou pós — nunca misturado</div>
          <SeletorEtapa value={etapa} onChange={setEtapa} />
        </SurfaceCard>

        <SurfaceCard className="p-3.5 px-4">
          <div className="text-[12.5px] font-medium text-text-3">Linha de corte</div>
          <div className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground">processar só o que aconteceu depois disso</div>
          <DateTimePicker value={linhaDeCorte} onChange={setLinhaDeCorte} />
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-2 p-3.5 px-4">
        <div className="text-[12.5px] font-medium text-text-3">Linhas do relatório</div>
        <div className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground">cole direto da planilha do cartório</div>
        <textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder={'protocolo,tipoAto,escrevente,dataHoraAndamento\n262414,VENDA E COMPRA,BARBARA RIBEIRO,2026-08-26 10:16:53'}
          className="h-64 w-full resize-y rounded-lg border border-dashed border-border bg-background p-3 font-mono text-xs text-foreground outline-none focus:border-primary"
        />
        {erro && <p className="mt-2 text-[13px] text-bad-fg">{erro}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          {qtdColadas > 0 && <span className="text-[12.5px] text-text-2">{qtdColadas} linhas coladas</span>}
          <Button
            className="ml-auto"
            disabled={qtdColadas === 0 || carregando}
            onClick={() => onContinuar({ etapa, linhaDeCorte: linhaDeCorte.toISOString(), texto })}
          >
            {carregando ? 'Processando…' : qtdColadas > 0 ? `Ler ${qtdColadas} linhas` : 'Ler linhas'}
          </Button>
        </div>
      </SurfaceCard>
    </div>
  )
}
