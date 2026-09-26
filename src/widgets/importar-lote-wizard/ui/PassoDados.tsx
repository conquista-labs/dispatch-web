import { isAxiosError } from 'axios'
import { ChevronDownIcon, FileSpreadsheetIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import type { Etapa } from '@/entities/protocolo'
import { useConverterRelatorio, type RelatorioConvertido } from '@/features/protocolo/converter-relatorio'
import type { LinhaImportacao } from '@/features/protocolo/importar-lote'
import { formatDataHora } from '@/shared/lib/format'
import { dataHoraParaIso, parseCsv } from '@/shared/lib/parse-csv'
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
const SeletorEtapa = ({
  value,
  onChange,
  desabilitado = false,
}: {
  value: Etapa
  onChange: (valor: Etapa) => void
  desabilitado?: boolean
}) => {
  const [aberto, setAberto] = useState(false)
  const selecionada = OPCOES_ETAPA.find((o) => o.valor === value)!

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={desabilitado}
          className="flex w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:border-muted-foreground/40 disabled:cursor-default disabled:opacity-70 disabled:hover:border-border"
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
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-secondary',
              opcao.valor === value && 'bg-secondary',
            )}
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

// Converte enquanto a pessoa digita — data incompleta ("2026-08-2") não pode derrubar a tela
// (`toISOString` lança com data inválida); fica vazia e o back recusa a linha na leitura.
const isoOuVazio = (valor: string) => {
  try {
    return dataHoraParaIso(valor)
  } catch {
    return ''
  }
}

// Linhas coladas (CSV com cabeçalho) → formato da importação. A data do CSV vem sem fuso e é lida
// como horário local do navegador (ver dataHoraParaIso).
const linhasDoCsv = (texto: string): LinhaImportacao[] =>
  parseCsv(texto).map((linha) => ({
    protocolo: linha.protocolo ?? '',
    tipoAto: linha.tipoAto ?? '',
    escrevente: linha.escrevente ?? '',
    dataHoraAndamento: isoOuVazio(linha.dataHoraAndamento ?? ''),
  }))

const dia = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

const motivoDoErro = (erro: unknown) => {
  const dados = isAxiosError(erro) ? (erro.response?.data as { motivo?: string } | undefined) : undefined
  return dados?.motivo ?? 'Não foi possível ler o arquivo. Confira se é o relatório de andamentos em .xls.'
}

type PassoDadosProps = {
  onContinuar: (dados: { etapa: Etapa; linhaDeCorte: string; linhas: LinhaImportacao[] }) => void
  carregando: boolean
  erro: string | null
}

// RF-05: duas entradas pro mesmo fluxo — o relatório .xls do sistema do cartório (lido pelo conector
// no back, que devolve as linhas no formato genérico e a etapa que o relatório declara) ou as linhas
// coladas de um CSV. RF-05a: com o arquivo, a etapa vem do relatório e o seletor trava — trocar a
// etapa de um relatório de pré-conferência daria prazo errado pro lote inteiro. RF-05b/RF-07: a
// "linha de corte" evita reimportar o que já foi processado (ver
// dispatch-api/docs/decisions/0006-linha-de-corte-no-lugar-de-dedup-por-numero.md) — pré-preenchida em
// "hoje 00:00" (mesmo default do protótipo aprovado); o aviso "N antes da linha de corte" deixa claro,
// antes de ler, quantas linhas do arquivo vão ser ignoradas por ela.
export const PassoDados = ({ onContinuar, carregando, erro }: PassoDadosProps) => {
  const [etapa, setEtapa] = useState<Etapa>('PreConferencia')
  const [linhaDeCorte, setLinhaDeCorte] = useState(inicioDeHoje)
  const [texto, setTexto] = useState('')
  const [relatorio, setRelatorio] = useState<(RelatorioConvertido & { arquivo: string }) | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const inputArquivo = useRef<HTMLInputElement>(null)
  const converter = useConverterRelatorio()

  const linhas = relatorio ? relatorio.linhas : texto.trim() ? linhasDoCsv(texto) : []
  const antesDoCorte = linhas.filter((l) => new Date(l.dataHoraAndamento) <= linhaDeCorte).length
  const datas = linhas.map((l) => l.dataHoraAndamento).sort()

  const enviar = (arquivo: File | undefined) => {
    if (!arquivo) return
    converter.mutate(arquivo, {
      onSuccess: (convertido) => {
        setRelatorio({ ...convertido, arquivo: arquivo.name })
        setEtapa(convertido.etapa)
      },
    })
  }

  const removerArquivo = () => {
    setRelatorio(null)
    converter.reset()
    if (inputArquivo.current) inputArquivo.current.value = ''
  }

  return (
    <div>
      <p className="mb-4 max-w-[70ch] text-[13.5px] text-text-2">
        Envie o relatório de andamentos do sistema do cartório (.xls) ou cole as linhas de um CSV. Antes de ler, confira
        a etapa do lote e a partir de quando processar.
      </p>

      <div className="grid grid-cols-2 gap-2 max-mobile:grid-cols-1">
        <SurfaceCard className="p-3.5 px-4">
          <div className="text-[12.5px] font-medium text-text-3">Etapa do relatório</div>
          <div className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground">
            {relatorio ? 'lida do relatório enviado' : 'o lote inteiro é pré ou pós — nunca misturado'}
          </div>
          <SeletorEtapa value={etapa} onChange={setEtapa} desabilitado={!!relatorio} />
        </SurfaceCard>

        <SurfaceCard className="p-3.5 px-4">
          <div className="text-[12.5px] font-medium text-text-3">Linha de corte</div>
          <div className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground">
            processar só o que aconteceu depois disso
          </div>
          <DateTimePicker value={linhaDeCorte} onChange={setLinhaDeCorte} />
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-2 p-3.5 px-4">
        <div className="text-[12.5px] font-medium text-text-3">Linhas do relatório</div>

        {relatorio ? (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <FileSpreadsheetIcon className="mt-0.5 size-4 flex-none text-text-2" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{relatorio.arquivo}</div>
                <div className="mt-0.5 text-[11.5px] text-pretty text-muted-foreground">
                  {relatorio.conector} · {relatorio.totalLido} protocolos lidos, conferem com o total do relatório
                  {datas.length > 0 && ` · andamentos de ${dia(datas[0])} a ${dia(datas[datas.length - 1])}`}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={removerArquivo} className="flex-none">
              Trocar arquivo
            </Button>
          </div>
        ) : (
          <>
            {/* Soltar o arquivo em qualquer ponto da área, ou escolher pelo botão. */}
            <div
              onDragOver={(evento) => {
                evento.preventDefault()
                setArrastando(true)
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(evento) => {
                evento.preventDefault()
                setArrastando(false)
                enviar(evento.dataTransfer.files[0])
              }}
              className={cn(
                'mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3',
                arrastando ? 'border-foreground bg-secondary' : 'border-border bg-background',
              )}
            >
              <div className="min-w-0 text-[12.5px] text-text-2">
                <span className="font-medium text-foreground">Relatório de andamentos (.xls)</span> — arraste o arquivo
                pra cá ou escolha no computador
              </div>
              <input
                ref={inputArquivo}
                type="file"
                accept=".xls,application/vnd.ms-excel"
                className="hidden"
                aria-label="Arquivo do relatório (.xls)"
                onChange={(evento) => enviar(evento.target.files?.[0])}
              />
              <Button
                variant="outline"
                onClick={() => inputArquivo.current?.click()}
                disabled={converter.isPending}
                className="flex-none"
              >
                {converter.isPending ? 'Lendo o arquivo…' : 'Escolher arquivo'}
              </Button>
            </div>
            {converter.isError && <p className="mt-2 text-[13px] text-bad-fg">{motivoDoErro(converter.error)}</p>}

            <div className="mt-3 mb-1.5 text-[11.5px] text-muted-foreground">ou cole as linhas de um CSV</div>
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              aria-label="Linhas do relatório em CSV"
              placeholder={
                'protocolo,tipoAto,escrevente,dataHoraAndamento\n262414,VENDA E COMPRA,BARBARA RIBEIRO,2026-08-26 10:16:53'
              }
              className="min-h-[132px] w-full resize-y rounded-lg border border-dashed border-zinc-300 bg-background px-3 py-[11px] font-mono text-[12.5px] leading-[1.6] text-foreground outline-none focus:border-primary dark:border-zinc-700"
            />
          </>
        )}

        {erro && <p className="mt-2 text-[13px] text-bad-fg">{erro}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          {linhas.length > 0 && (
            <span className="text-[12.5px] text-text-2">
              {relatorio ? `${linhas.length} linhas no arquivo` : `${linhas.length} linhas coladas`}
              {antesDoCorte > 0 && (
                <span className="text-warn-fg">
                  {' '}
                  · {antesDoCorte} antes da linha de corte ({formatDataHora(linhaDeCorte.toISOString())}) — serão
                  ignoradas
                </span>
              )}
            </span>
          )}
          <Button
            className="ml-auto"
            disabled={linhas.length === 0 || carregando}
            onClick={() => onContinuar({ etapa, linhaDeCorte: linhaDeCorte.toISOString(), linhas })}
          >
            {carregando ? 'Processando…' : linhas.length > 0 ? `Ler ${linhas.length} linhas` : 'Ler linhas'}
          </Button>
        </div>
      </SurfaceCard>
    </div>
  )
}
