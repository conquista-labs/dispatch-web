import { useState } from 'react'

import { ETAPA_LABEL, type Etapa } from '@/entities/protocolo'
import { Button } from '@/shared/ui/button'
import { DateTimePicker } from '@/shared/ui/datetime-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const DEZ_ANOS_ATRAS = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)

type PassoDadosProps = {
  onContinuar: (dados: { etapa: Etapa; linhaDeCorte: string; texto: string }) => void
  carregando: boolean
  erro: string | null
}

// RF-05/RF-06: arquivo de verdade (.csv/.xlsx) fica pra depois — colar linhas já cobre o RF,
// e é como o dono testou a importação a sessão inteira. RF-07: a "linha de corte" evita
// reimportar o que já foi processado (ver CLAUDE.md do dispatch-api) — pré-preenchida bem no
// passado pra não descartar nada na primeira importação de alguém.
export const PassoDados = ({ onContinuar, carregando, erro }: PassoDadosProps) => {
  const [etapa, setEtapa] = useState<Etapa>('PreConferencia')
  const [linhaDeCorte, setLinhaDeCorte] = useState(DEZ_ANOS_ATRAS)
  const [texto, setTexto] = useState('')

  return (
    <div>
      <div className="flex gap-4">
        <div className="flex-1">
          <span className="block text-[12.5px] font-medium text-text-4">Etapa deste relatório</span>
          <Select value={etapa} onValueChange={(valor) => setEtapa(valor as Etapa)}>
            <SelectTrigger className="mt-1.5 h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PreConferencia">{ETAPA_LABEL.PreConferencia}</SelectItem>
              <SelectItem value="PosConferencia">{ETAPA_LABEL.PosConferencia}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <span className="block text-[12.5px] font-medium text-text-4">Linha de corte</span>
          <div className="mt-1.5">
            <DateTimePicker value={linhaDeCorte} onChange={setLinhaDeCorte} />
          </div>
          <span className="mt-1 block text-[11px] text-muted-foreground">linhas com andamento até aqui são ignoradas (já processadas antes)</span>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="block text-[12.5px] font-medium text-text-4">Linhas do relatório</span>
        <textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder={'protocolo,tipoAto,escrevente,dataHoraAndamento\n262414,VENDA E COMPRA,BARBARA RIBEIRO,2026-08-26 10:16:53'}
          className="mt-1.5 h-64 w-full resize-y rounded-[10px] border border-dashed border-border bg-card p-3 font-mono text-xs text-foreground outline-none focus:border-primary"
        />
      </label>

      {erro && <p className="mt-2 text-[13px] text-bad-fg">{erro}</p>}

      <div className="mt-4 flex justify-end">
        <Button disabled={!texto.trim() || carregando} onClick={() => onContinuar({ etapa, linhaDeCorte: linhaDeCorte.toISOString(), texto })}>
          {carregando ? 'Processando…' : 'Pré-visualizar'}
        </Button>
      </div>
    </div>
  )
}
