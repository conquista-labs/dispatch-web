import { isAxiosError } from 'axios'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useConfiguracao, type Configuracao } from '@/entities/configuracao'
import { useAtualizarConfiguracao } from '@/features/configuracao/atualizar'
import { formatDuracaoCurta } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'
import { SurfaceCard } from '@/shared/ui/surface-card'

type TipoCampo = 'dur' | 'num' | 'pct'

type CampoConfig = {
  chave: keyof Configuracao
  rotulo: string
  ajuda: string
  tipo: TipoCampo
  unidade?: string
  passo?: number
  min?: number
}

// Seção 8 do documento de requisitos — 3 grupos, 12 campos, mesma organização e texto de ajuda
// do protótipo aprovado (`Dispatch.dc.html`, `configVals`). "dur" e "num" são o mesmo controle
// (stepper ± + valor digitável, unidade "min" implícita em "dur"); "pct" guarda 0–1 no back mas
// mostra/edita 0–100 (mesmo padrão de "front multiplica por 100" já usado no índice de
// confiança da sugestão).
const SECOES: { nome: string; sub: string; campos: CampoConfig[] }[] = [
  {
    nome: 'Semáforo de prazo',
    sub: 'Define quando o card muda de cor. As faixas contam para trás, a partir do vencimento.',
    campos: [
      {
        chave: 'faixaAtencaoMinutos',
        rotulo: 'Faixa de atenção',
        ajuda: 'Quando falta menos que isso, o card fica amarelo.',
        tipo: 'dur',
      },
      {
        chave: 'faixaUrgenteMinutos',
        rotulo: 'Faixa de urgência',
        ajuda: 'Quando falta menos que isso, o card fica laranja. Passado o vencimento, vermelho.',
        tipo: 'dur',
      },
    ],
  },
  {
    nome: 'Distribuição e conferência',
    sub: 'Governam o motor de distribuição e o que o conferente pode fazer.',
    campos: [
      {
        chave: 'limiteDeAtosSimultaneos',
        rotulo: 'Atos simultâneos por conferente',
        ajuda: 'Quantos atos uma pessoa pode conduzir ao mesmo tempo. Com 1, iniciar outro exige concluir o atual.',
        tipo: 'num',
        unidade: 'ato(s)',
        passo: 1,
        min: 1,
      },
      {
        chave: 'janelaDeCorrecaoMinutos',
        rotulo: 'Janela de correção',
        ajuda:
          'Tempo que o conferente tem para trocar aprovado por reprovado depois de concluir. Depois disso, só a distribuidora reabre.',
        tipo: 'dur',
      },
      {
        chave: 'tempoMedioPorAtoMinutos',
        rotulo: 'Tempo médio por ato',
        ajuda: 'Base do cálculo de capacidade estimada do dia no painel.',
        tipo: 'num',
        unidade: 'min',
        passo: 1,
        min: 1,
      },
    ],
  },
  {
    nome: 'Aprendizado',
    sub: 'Os limiares que decidem quando o sistema propõe uma sugestão. Valores baixos geram mais propostas; altos, só padrões consolidados.',
    campos: [
      {
        chave: 'diasDeMemoriaDescarte',
        rotulo: 'Memória do descarte',
        ajuda:
          'Sugestão recusada não volta a aparecer durante esse período. Zero faz a proposta reaparecer no dia seguinte.',
        tipo: 'num',
        unidade: 'dias',
        passo: 5,
        min: 0,
      },
      {
        chave: 'limiarTipoDesconhecido',
        rotulo: 'Casos para propor "tipo desconhecido"',
        ajuda: 'Quantas vezes um tipo fora do catálogo precisa aparecer antes de o sistema sugerir cadastrá-lo.',
        tipo: 'num',
        unidade: 'casos',
        passo: 1,
        min: 1,
      },
      {
        chave: 'limiarPrazoIrrealCasos',
        rotulo: 'Casos para propor "prazo irreal"',
        ajuda: 'Volume mínimo de atos observados antes de o sistema questionar o prazo de uma equipe.',
        tipo: 'num',
        unidade: 'casos',
        passo: 1,
        min: 1,
      },
      {
        chave: 'limiarPrazoIrrealEstouro',
        rotulo: 'Estouro para propor "prazo irreal"',
        ajuda: 'Percentual desses casos que precisa ter estourado o prazo para a sugestão nascer.',
        tipo: 'pct',
      },
      {
        chave: 'limiarEscreventeOrfao',
        rotulo: 'Casos para propor "escrevente órfão"',
        ajuda: 'Quantos atos de um escrevente sem equipe bastam para o sistema pedir que ele seja alocado.',
        tipo: 'num',
        unidade: 'casos',
        passo: 1,
        min: 1,
      },
      {
        chave: 'limiarRiscoQualidadeCasos',
        rotulo: 'Casos para propor "risco de qualidade"',
        ajuda: 'Volume mínimo de atos conferidos antes de o sistema olhar a taxa de reprovação.',
        tipo: 'num',
        unidade: 'casos',
        passo: 1,
        min: 1,
      },
      {
        chave: 'limiarRiscoQualidadeReprovacao',
        rotulo: 'Reprovação para propor "risco de qualidade"',
        ajuda: 'Taxa de reprovação a partir da qual o sistema sugere revisar alçada ou treinar a pessoa.',
        tipo: 'pct',
      },
    ],
  },
]

const TODAS_AS_CHAVES = SECOES.flatMap((secao) => secao.campos.map((campo) => campo.chave))

// Mesma regra de AtualizarConfiguracao.Validar (back) — validado aqui primeiro pra dar erro por
// campo antes de gastar uma chamada de rede; o back continua sendo quem decide de verdade (um
// 400 dele vira aviso geral, não por campo, já que só devolve um motivo por vez).
const validar = (v: Configuracao): Partial<Record<keyof Configuracao, string>> => {
  const e: Partial<Record<keyof Configuracao, string>> = {}
  if (!(v.faixaAtencaoMinutos > 0)) e.faixaAtencaoMinutos = 'A faixa de atenção precisa ser maior que zero.'
  if (!(v.faixaUrgenteMinutos > 0)) e.faixaUrgenteMinutos = 'A faixa de urgência precisa ser maior que zero.'
  else if (v.faixaAtencaoMinutos > 0 && v.faixaUrgenteMinutos >= v.faixaAtencaoMinutos)
    e.faixaUrgenteMinutos = 'A urgência precisa ser menor que a atenção — senão o laranja nunca aparece.'
  if (!(v.limiteDeAtosSimultaneos >= 1)) e.limiteDeAtosSimultaneos = 'Precisa ser pelo menos 1.'
  if (!(v.janelaDeCorrecaoMinutos > 0)) e.janelaDeCorrecaoMinutos = 'A janela de correção precisa ser maior que zero.'
  if (!(v.tempoMedioPorAtoMinutos > 0)) e.tempoMedioPorAtoMinutos = 'O tempo médio por ato precisa ser maior que zero.'
  if (!(v.diasDeMemoriaDescarte >= 0)) e.diasDeMemoriaDescarte = 'Não pode ser negativo.'
  ;(
    ['limiarTipoDesconhecido', 'limiarPrazoIrrealCasos', 'limiarEscreventeOrfao', 'limiarRiscoQualidadeCasos'] as const
  ).forEach((chave) => {
    if (!(v[chave] >= 1)) e[chave] = 'O limiar de casos precisa ser pelo menos 1.'
  })
  ;(['limiarPrazoIrrealEstouro', 'limiarRiscoQualidadeReprovacao'] as const).forEach((chave) => {
    if (!(v[chave] >= 0 && v[chave] <= 1)) e[chave] = 'O percentual precisa ficar entre 0 e 100.'
  })
  return e
}

type MiniStepperProps = {
  valor: number
  min: number
  passo?: number
  onAlterar: (valor: number) => void
  comErro?: boolean
}

// Grupo −/valor/+ compartilhado pelos 3 tipos de campo (dur usa dois lado a lado — horas e
// minutos — num usa um só). Mesmo padrão visual de TipoAtoRow (peso) e do Stepper do
// DateTimePicker (hora/minuto), sem reaproveitar o componente deles direto — os dois já são
// específicos demais do próprio contexto (clamp 2 dígitos, decimais) pra generalizar aqui.
const MiniStepper = ({ valor, min, passo = 1, onAlterar, comErro }: MiniStepperProps) => {
  const [texto, setTexto] = useState(String(valor))
  const [refletido, setRefletido] = useState(valor)
  if (valor !== refletido) {
    setRefletido(valor)
    setTexto(String(valor))
  }

  const commit = () => {
    const numero = Number.parseInt(texto.replace(/\D/g, ''), 10)
    if (Number.isNaN(numero)) {
      setTexto(String(valor))
      return
    }
    onAlterar(Math.max(min, numero))
  }

  return (
    <div
      className={cn(
        'flex items-center gap-px rounded-md border bg-background p-0.5',
        comErro ? 'border-bad-border-2' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={() => onAlterar(Math.max(min, valor - passo))}
        className="flex size-6 flex-none items-center justify-center rounded text-text-2 hover:bg-secondary"
      >
        <MinusIcon className="size-3.5" />
      </button>
      <input
        value={texto}
        onChange={(event) => setTexto(event.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
        onFocus={(event) => event.target.select()}
        inputMode="numeric"
        size={3}
        className="w-[34px] flex-none border-none bg-transparent text-center font-mono text-[12.5px] font-medium outline-none"
      />
      <button
        type="button"
        onClick={() => onAlterar(valor + passo)}
        className="flex size-6 flex-none items-center justify-center rounded text-text-2 hover:bg-secondary"
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  )
}

type CampoProps = {
  campo: CampoConfig
  valor: number
  erro?: string
  onAlterar: (valor: number) => void
}

const Campo = ({ campo, valor, erro, onAlterar }: CampoProps) => {
  const linha = (controle: ReactNode, direita?: ReactNode) => (
    <div className="border-t border-secondary py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[42ch] min-w-0">
          <div className="text-[13px] font-medium">{campo.rotulo}</div>
          <div className="mt-0.5 text-[11.5px] text-pretty text-muted-foreground">{campo.ajuda}</div>
        </div>
        <div className="flex flex-none items-center gap-2">
          {controle}
          {direita}
        </div>
      </div>
      {erro && <div className="mt-1 text-[11.5px] text-bad-fg">{erro}</div>}
    </div>
  )

  // Faixas/janelas: dois steppers lado a lado (horas, minutos) — mesma UX do protótipo
  // (`configVals.dur`) — em vez de um único campo em minutos puros, bem menos legível pra
  // valores tipo "4h" ou "1h20".
  if (campo.tipo === 'dur') {
    const horas = Math.floor(Math.max(0, valor) / 60)
    const minutos = Math.max(0, Math.round(valor)) % 60
    return linha(
      <>
        <div className="flex items-center gap-1.5">
          <MiniStepper valor={horas} min={0} comErro={!!erro} onAlterar={(h) => onAlterar(h * 60 + minutos)} />
          <span className="font-mono text-[11px] text-text-2">h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MiniStepper valor={minutos} min={0} comErro={!!erro} onAlterar={(m) => onAlterar(horas * 60 + m)} />
          <span className="font-mono text-[11px] text-text-2">min</span>
        </div>
      </>,
      <span className="w-16 flex-none text-right font-mono text-[11.5px] text-text-2">
        {formatDuracaoCurta(valor * 60_000)}
      </span>,
    )
  }

  if (campo.tipo === 'pct') {
    // Guarda fração (0–1) no back — o campo trabalha em 0–100 (inteiro), convertendo só na
    // borda (mesmo padrão de "front multiplica por 100" do índice de confiança da sugestão).
    const percentual = Math.round(valor * 100)
    return linha(
      <input
        type="range"
        min={0}
        max={100}
        value={percentual}
        onChange={(event) => onAlterar(Number(event.target.value) / 100)}
        className="h-1.5 w-[140px] flex-none accent-foreground"
      />,
      <span
        className={cn(
          'flex w-16 flex-none items-center justify-center gap-0.5 rounded-md border bg-background px-1.5 py-1 font-mono text-[12.5px] font-medium',
          erro ? 'border-bad-border-2' : 'border-border',
        )}
      >
        {percentual}%
      </span>,
    )
  }

  return linha(
    <MiniStepper valor={valor} min={campo.min ?? 0} passo={campo.passo ?? 1} comErro={!!erro} onAlterar={onAlterar} />,
    <span className="w-14 flex-none font-mono text-[11.5px] text-text-2">{campo.unidade}</span>,
  )
}

// Seção 8 — nova aba, editável numa chamada só (RF conforme protótipo reexportado: "Configuração",
// abasRegras). Rascunho local (sem PATCH parcial no back) até "Salvar configuração"; erro por
// campo validado no cliente primeiro (mesma regra do back), 400 do back vira aviso geral (só
// devolve um motivo por vez, não dá pra mapear pra um campo específico com segurança).
export const AbaConfiguracao = () => {
  const { data: configuracao } = useConfiguracao()
  const atualizar = useAtualizarConfiguracao()

  const [rascunho, setRascunho] = useState<Configuracao | null>(null)
  const [erros, setErros] = useState<Partial<Record<keyof Configuracao, string>>>({})
  const [avisoGeral, setAvisoGeral] = useState<string | null>(null)
  const [salvoAgora, setSalvoAgora] = useState(false)

  if (configuracao && rascunho === null) {
    setRascunho(configuracao)
  }

  if (!configuracao || !rascunho) {
    return <Carregando className="mt-5" />
  }

  const sujo = TODAS_AS_CHAVES.some((chave) => rascunho[chave] !== configuracao[chave])

  const alterar = (chave: keyof Configuracao, valor: number) => {
    setRascunho((atual) => (atual ? { ...atual, [chave]: valor } : atual))
    setErros((atual) => {
      if (!(chave in atual)) return atual
      const proximo = { ...atual }
      delete proximo[chave]
      return proximo
    })
    setSalvoAgora(false)
  }

  const descartar = () => {
    setRascunho(configuracao)
    setErros({})
    setAvisoGeral(null)
    setSalvoAgora(false)
  }

  const salvar = () => {
    if (!sujo) return
    const novosErros = validar(rascunho)
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      setSalvoAgora(false)
      return
    }
    setAvisoGeral(null)
    atualizar.mutate(rascunho, {
      onSuccess: () => setSalvoAgora(true),
      onError: (error) => {
        const dados = isAxiosError(error) ? (error.response?.data as { motivo?: string } | undefined) : undefined
        setAvisoGeral(dados?.motivo ?? 'Não foi possível salvar a configuração — tente de novo.')
      },
    })
  }

  return (
    <div className="max-w-[800px]">
      <h2 className="mt-5.5 mb-0 text-[15px] font-semibold tracking-[-0.01em]">Configuração do sistema</h2>
      <p className="mt-1.5 max-w-[72ch] text-[13px] text-pretty text-text-2">
        Os números que o motor de distribuição, o semáforo de prazo e o módulo de aprendizado consultam. Alterar aqui
        muda o comportamento de todo o cartório a partir do próximo protocolo — nada é aplicado retroativamente.
      </p>

      {avisoGeral && (
        <div className="mt-3 rounded-[10px] border border-bad-border-2 bg-bad-bg p-3 text-[12.5px] text-bad-fg">
          {avisoGeral}
        </div>
      )}
      {salvoAgora && !sujo && (
        <div className="mt-3 rounded-[10px] border border-ok-border bg-ok-bg p-3 text-[12.5px] text-ok-fg">
          Configuração salva.
        </div>
      )}

      <div className="mt-4.5 flex flex-col gap-3.5">
        {SECOES.map((secao) => (
          <div key={secao.nome}>
            <div className="mb-1.5">
              <strong className="text-[13.5px] font-semibold">{secao.nome}</strong>
              <div className="mt-0.5 text-[11.5px] text-pretty text-muted-foreground">{secao.sub}</div>
            </div>
            <SurfaceCard className="p-0 px-3.5">
              {secao.campos.map((campo) => (
                <Campo
                  key={campo.chave}
                  campo={campo}
                  valor={rascunho[campo.chave]}
                  erro={erros[campo.chave]}
                  onAlterar={(valor) => alterar(campo.chave, valor)}
                />
              ))}
            </SurfaceCard>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-1.5">
        <Button size="sm" onClick={salvar} disabled={!sujo || atualizar.isPending}>
          {sujo ? 'Salvar configuração' : 'Nada alterado'}
        </Button>
        {sujo && (
          <Button variant="outline" size="sm" onClick={descartar}>
            Descartar
          </Button>
        )}
      </div>
    </div>
  )
}
