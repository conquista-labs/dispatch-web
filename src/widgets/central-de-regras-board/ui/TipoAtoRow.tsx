import { isAxiosError } from 'axios'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

import type { TempoReferencia, TipoAtoComUso } from '@/entities/tipoAto'
import { useAlterarStatusTipoAto } from '@/features/tipoAto/alterar-status'
import { useDefinirPesoTipoAto } from '@/features/tipoAto/definir-peso'
import { useDefinirTempoReferencia } from '@/features/tipoAto/definir-tempo-referencia'
import { useRemoverTipoAto } from '@/features/tipoAto/remover'
import { useRenomearTipoAto } from '@/features/tipoAto/renomear'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

// Peso decimal do protótipo v2 (decisão do dono): 0,50–2,50 em passos de 0,05, mostrado "1,60×".
const PESO_MIN = 0.5
const PESO_MAX = 2.5
const PESO_PASSO = 0.05
const TEMPO_MIN = 2
const TEMPO_MAX = 240

const arredondarPeso = (valor: number) => Math.round(valor / PESO_PASSO) * PESO_PASSO
const formatarPeso = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const rotuloDaOrigem = (referencia: TempoReferencia) =>
  referencia.origem === 'Informado'
    ? 'informado por você'
    : referencia.origem === 'Historico'
      ? `mediana de ${referencia.conferenciasNoHistorico} atos`
      : 'estimado · poucos dados'

type TipoAtoRowProps = {
  tipo: TipoAtoComUso
}

// RF-34a-b,d-f — uma linha da tabela (protótipo v2: Tipo de ato | Histórico | Complexidade | Tempo
// de referência | Ações; no celular a linha empilha, em vez da rolagem lateral do protótipo). O nome
// é um botão que quebra linha e vira campo ao clicar (commit no blur/Enter, Esc desfaz) — o <input>
// fixo cortava nomes longos ("Cessão de Direitos Decorrentes d…"). Peso via stepper ± OU digitando direto (mesmo padrão de hora/minuto do
// DateTimePicker — input controlado com w-[Npx] fixo, não min-w sozinho, senão o tamanho
// intrínseco do <input> estoura o layout), ativar/desativar e remover com feedback do 409
// "em uso" (RF-34e — mesclar dois tipos, RF-34c, fica de fora, não tem ação aqui pra isso ainda).
export const TipoAtoRow = ({ tipo }: TipoAtoRowProps) => {
  const [nome, setNome] = useState(tipo.nome)
  const [editandoNome, setEditandoNome] = useState(false)
  const [pesoTexto, setPesoTexto] = useState(formatarPeso(tipo.pesoComplexidade))
  const renomear = useRenomearTipoAto()
  const alterarStatus = useAlterarStatusTipoAto()
  const definirPeso = useDefinirPesoTipoAto()
  const definirTempo = useDefinirTempoReferencia()
  const remover = useRemoverTipoAto()

  // Ajusta o estado local durante o render, sem efeito (achado ligando mais categorias do
  // oxlint) — mesmo padrão de EquipeCard.tsx.
  const [nomeRefletido, setNomeRefletido] = useState(tipo.nome)
  if (tipo.nome !== nomeRefletido) {
    setNomeRefletido(tipo.nome)
    setNome(tipo.nome)
  }
  const [pesoRefletido, setPesoRefletido] = useState(tipo.pesoComplexidade)
  if (tipo.pesoComplexidade !== pesoRefletido) {
    setPesoRefletido(tipo.pesoComplexidade)
    setPesoTexto(formatarPeso(tipo.pesoComplexidade))
  }

  const commitNome = () => {
    setEditandoNome(false)
    const aparado = nome.trim()
    if (aparado && aparado !== tipo.nome) {
      renomear.mutate({ tipoAtoId: tipo.id, nome: aparado })
    } else {
      setNome(tipo.nome)
    }
  }

  const aplicarPeso = (novo: number) => {
    const clampado = Number(Math.min(PESO_MAX, Math.max(PESO_MIN, arredondarPeso(novo))).toFixed(2))
    if (clampado === tipo.pesoComplexidade) {
      setPesoTexto(formatarPeso(tipo.pesoComplexidade))
      return
    }
    definirPeso.mutate({ tipoAtoId: tipo.id, peso: clampado })
  }

  const mexerPeso = (delta: number) => aplicarPeso(tipo.pesoComplexidade + delta)

  const commitPesoTexto = () => {
    const numero = Number.parseFloat(pesoTexto.replace(',', '.'))
    if (Number.isNaN(numero)) {
      setPesoTexto(formatarPeso(tipo.pesoComplexidade))
      return
    }
    aplicarPeso(numero)
  }

  const referencia = tipo.tempoReferencia
  const mexerTempo = (delta: number) => {
    if (!referencia) return
    const novo = Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, referencia.minutos + delta))
    if (novo !== referencia.minutos) definirTempo.mutate({ tipoAtoId: tipo.id, minutos: novo })
  }

  const emUso = isAxiosError(remover.error) && remover.error.response?.status === 409

  const historico = referencia?.conferenciasNoHistorico
  const stepper = 'flex items-center gap-px rounded-[7px] border border-border bg-background p-0.5'
  const botaoStepper =
    'flex size-5 items-center justify-center rounded-[5px] text-text-2 hover:bg-secondary max-mobile:size-8'

  return (
    <div
      data-tipo-ato-linha
      className={cn(
        // Entre 760px e ~1000px a tabela pode ficar mais estreita que as colunas: o piso de 680px faz
        // o contêiner rolar de lado (só a tabela), em vez de quebrar as colunas desalinhadas.
        'flex flex-wrap items-center border-b border-secondary px-3.5 py-2.5 last:border-b-0 max-mobile:gap-x-4 max-mobile:gap-y-2.5 max-mobile:py-3 min-[760px]:min-w-[680px]',
        !tipo.ativo && 'opacity-60',
      )}
    >
      <div className="min-w-[150px] flex-1 pr-2.5 max-mobile:basis-full max-mobile:pr-0">
        {editandoNome ? (
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            onBlur={commitNome}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                setNome(tipo.nome)
                setEditandoNome(false)
              }
            }}
            aria-label="Nome do tipo de ato"
            autoFocus
            className="-ml-1.75 w-full rounded-md border border-foreground bg-background px-1.75 py-0.75 text-[13.5px] font-medium outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditandoNome(true)}
            title="Clique para renomear"
            className="-ml-1.5 block w-full rounded-md border border-transparent px-1.5 py-0.5 text-left text-[13.5px] leading-[1.3] font-medium text-pretty hover:border-border"
          >
            {tipo.nome}
          </button>
        )}
        <div className="mt-0.75 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span>{tipo.volume} em circulação</span>
          <span className={tipo.conferentesComAlcada === 0 ? 'text-bad-fg' : undefined}>
            {tipo.conferentesComAlcada === 0 ? 'ninguém com alçada' : `${tipo.conferentesComAlcada} com alçada`}
          </span>
          {historico !== undefined && <span className="min-[760px]:hidden">{historico} no histórico</span>}
        </div>
      </div>

      <span className="w-[78px] flex-none text-right font-mono text-[12.5px] font-medium max-mobile:hidden">
        {historico ?? '—'}
      </span>

      <div className="flex w-[104px] flex-none justify-end max-mobile:w-auto max-mobile:items-center max-mobile:gap-2">
        <span className="text-[11.5px] font-medium text-text-2 min-[760px]:hidden">Peso</span>
        <div className={stepper}>
          <button
            type="button"
            aria-label="Diminuir peso"
            onClick={() => mexerPeso(-PESO_PASSO)}
            className={botaoStepper}
          >
            <MinusIcon className="size-3" />
          </button>
          <input
            value={pesoTexto}
            onChange={(event) => setPesoTexto(event.target.value.replace(/[^\d,.]/g, ''))}
            onBlur={commitPesoTexto}
            onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
            inputMode="decimal"
            aria-label="Peso de complexidade"
            size={4}
            className="w-[34px] flex-none rounded text-right font-mono text-[11.5px] font-medium outline-none focus:bg-secondary"
          />
          <span aria-hidden className="pr-0.5 font-mono text-[11.5px] font-medium">
            ×
          </span>
          <button
            type="button"
            aria-label="Aumentar peso"
            onClick={() => mexerPeso(PESO_PASSO)}
            className={botaoStepper}
          >
            <PlusIcon className="size-3" />
          </button>
        </div>
      </div>

      {/* RF-46c / RF-34a — tempo de referência: stepper de 1 em 1 min (informar fixa o valor), a
          origem do número e "Usar histórico" quando há mediana e o valor foi informado à mão. */}
      <div className="flex w-[150px] flex-none flex-col items-end gap-0.75 max-mobile:w-auto max-mobile:items-start">
        {referencia ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-medium text-text-2 min-[760px]:hidden">Referência</span>
              <div className={stepper}>
                <button
                  type="button"
                  aria-label="Diminuir tempo de referência"
                  onClick={() => mexerTempo(-1)}
                  disabled={definirTempo.isPending}
                  className={botaoStepper}
                >
                  <MinusIcon className="size-3" />
                </button>
                <span className="min-w-[44px] text-center font-mono text-[11.5px] font-medium">
                  {referencia.minutos} min
                </span>
                <button
                  type="button"
                  aria-label="Aumentar tempo de referência"
                  onClick={() => mexerTempo(1)}
                  disabled={definirTempo.isPending}
                  className={botaoStepper}
                >
                  <PlusIcon className="size-3" />
                </button>
              </div>
            </div>
            <span className="flex flex-wrap items-center justify-end gap-x-1.5 text-[10.5px]">
              <span className={referencia.origem === 'Estimado' ? 'text-warn-fg' : 'text-apoio'}>
                {rotuloDaOrigem(referencia)}
              </span>
              {referencia.origem === 'Informado' && referencia.medianaMinutos !== null && (
                <button
                  type="button"
                  onClick={() => definirTempo.mutate({ tipoAtoId: tipo.id, minutos: null })}
                  disabled={definirTempo.isPending}
                  className="font-medium text-text-2 underline decoration-dotted hover:text-foreground"
                >
                  usar histórico ({referencia.medianaMinutos} min)
                </button>
              )}
            </span>
          </>
        ) : (
          <span className="font-mono text-[12px] text-muted-foreground">—</span>
        )}
      </div>

      <div className="flex w-[150px] flex-none justify-end gap-1.5 max-mobile:ml-auto max-mobile:w-auto">
        <button
          onClick={() => alterarStatus.mutate({ tipoAtoId: tipo.id, ativo: !tipo.ativo })}
          disabled={alterarStatus.isPending}
          className={cn(
            'flex-none rounded-full border px-2.5 py-0.75 text-[11.5px] font-medium max-mobile:min-h-9',
            tipo.ativo ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
          )}
        >
          {tipo.ativo ? 'Ativo' : 'Inativo'}
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => remover.mutate(tipo.id)}
          disabled={remover.isPending}
          className="h-6.5 flex-none px-2.25 text-[11.5px] text-text-2 max-mobile:h-9"
        >
          Remover
        </Button>
      </div>

      {emUso && (
        <p className="mt-1.5 w-full text-[12px] text-bad-fg">
          Em uso — tem protocolo ou regra de alçada apontando pra este tipo.
        </p>
      )}
    </div>
  )
}
