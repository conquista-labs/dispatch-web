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
import { SurfaceCard } from '@/shared/ui/surface-card'

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

// RF-34a-b,d-f — uma linha da tabela: nome edita inline (commit no blur, mesmo padrão de
// EquipeCard), peso via stepper ± OU digitando direto (mesmo padrão de hora/minuto do
// DateTimePicker — input controlado com w-[Npx] fixo, não min-w sozinho, senão o tamanho
// intrínseco do <input> estoura o layout), ativar/desativar e remover com feedback do 409
// "em uso" (RF-34e — mesclar dois tipos, RF-34c, fica de fora, não tem ação aqui pra isso ainda).
export const TipoAtoRow = ({ tipo }: TipoAtoRowProps) => {
  const [nome, setNome] = useState(tipo.nome)
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

  return (
    <SurfaceCard className={cn('flex flex-wrap items-center gap-3.5 p-3', !tipo.ativo && 'opacity-60')}>
      <input
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        onBlur={commitNome}
        className="min-w-[160px] flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[13.5px] font-medium text-foreground outline-none hover:border-border focus:border-foreground focus:bg-card"
      />

      <span className="flex-none font-mono text-[11.5px] text-muted-foreground">{tipo.volume} em circulação</span>
      <span className="flex-none font-mono text-[11.5px] text-muted-foreground">
        {tipo.conferentesComAlcada} com alçada
      </span>

      <div className="flex flex-none items-center gap-2">
        <span className="text-[11.5px] font-medium text-text-2">Peso</span>
        <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            aria-label="Diminuir peso"
            onClick={() => mexerPeso(-PESO_PASSO)}
            className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
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
            className="w-[38px] flex-none rounded text-center font-mono text-[12.5px] font-medium outline-none focus:bg-secondary"
          />
          <button
            type="button"
            aria-label="Aumentar peso"
            onClick={() => mexerPeso(PESO_PASSO)}
            className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
          >
            <PlusIcon className="size-3" />
          </button>
        </div>
      </div>

      {/* RF-46c / RF-34a — tempo de referência: stepper de 1 em 1 min (informar fixa o valor), a
          origem do número e "Usar histórico" quando há mediana e o valor foi informado à mão. */}
      {referencia && (
        <div className="flex flex-none flex-wrap items-center gap-2">
          <span className="text-[11.5px] font-medium text-text-2">Referência</span>
          <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
            <button
              type="button"
              aria-label="Diminuir tempo de referência"
              onClick={() => mexerTempo(-1)}
              disabled={definirTempo.isPending}
              className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="min-w-[44px] text-center font-mono text-[12.5px] font-medium">
              {referencia.minutos} min
            </span>
            <button
              type="button"
              aria-label="Aumentar tempo de referência"
              onClick={() => mexerTempo(1)}
              disabled={definirTempo.isPending}
              className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
            >
              <PlusIcon className="size-3" />
            </button>
          </div>
          <span className={cn('text-[11px]', referencia.origem === 'Estimado' ? 'text-warn-fg' : 'text-apoio')}>
            {rotuloDaOrigem(referencia)}
          </span>
          {referencia.origem === 'Informado' && referencia.medianaMinutos !== null && (
            <button
              type="button"
              onClick={() => definirTempo.mutate({ tipoAtoId: tipo.id, minutos: null })}
              disabled={definirTempo.isPending}
              className="text-[11.5px] font-medium text-text-2 underline decoration-dotted hover:text-foreground"
            >
              Usar histórico ({referencia.medianaMinutos} min)
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => alterarStatus.mutate({ tipoAtoId: tipo.id, ativo: !tipo.ativo })}
        disabled={alterarStatus.isPending}
        className={cn(
          'flex-none rounded-full border px-2.5 py-1 text-xs font-medium',
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
        className="flex-none"
      >
        Remover
      </Button>

      {emUso && (
        <p className="w-full text-[12px] text-bad-fg">
          Em uso — tem protocolo ou regra de alçada apontando pra este tipo.
        </p>
      )}
    </SurfaceCard>
  )
}
