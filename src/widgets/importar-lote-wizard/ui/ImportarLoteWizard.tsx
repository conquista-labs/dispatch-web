import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Etapa } from '@/entities/protocolo'
import { useConfirmarLote, usePreVisualizarLote, type ResumoImportacao } from '@/features/protocolo/importar-lote'
import { dataHoraParaIso, parseCsv } from '@/shared/lib/parse-csv'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

import { PassoDados } from './PassoDados'
import { PassoLinhas } from './PassoLinhas'
import { PassoPrevia } from './PassoPrevia'

type Passo = 'dados' | 'revisao' | 'distribuicao' | 'concluido'

// handleContinuar e handleConfirmar montavam o mesmo payload de linhas, cada um com sua
// própria cópia do `.map(...)` — achado numa auditoria de qualidade.
const paraRequestLinhas = (linhas: ReturnType<typeof parseCsv>) =>
  linhas.map((linha) => ({
    protocolo: linha.protocolo ?? '',
    tipoAto: linha.tipoAto ?? '',
    escrevente: linha.escrevente ?? '',
    dataHoraAndamento: dataHoraParaIso(linha.dataHoraAndamento ?? ''),
  }))

const PASSOS: { valor: Passo; label: string }[] = [
  { valor: 'dados', label: 'Dados' },
  { valor: 'revisao', label: 'Revisão' },
  { valor: 'distribuicao', label: 'Distribuição' },
]

// Círculo numerado + linha conectando (protótipo aprovado) — não é chip/pill. Passo concluído
// e o atual ficam com o círculo preenchido; só o rótulo do atual fica com texto forte.
const IndicadorDePassos = ({ passo }: { passo: Passo }) => {
  const indiceAtual = passo === 'concluido' ? PASSOS.length : PASSOS.findIndex((p) => p.valor === passo)

  return (
    <div className="mb-5 flex items-center gap-2">
      {PASSOS.map((item, indice) => {
        const atingido = indiceAtual >= indice
        const atual = indiceAtual === indice
        return (
          <div key={item.valor} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-[22px] flex-none items-center justify-center rounded-full border font-mono text-[11px] font-medium',
                atingido ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
              )}
            >
              {indice + 1}
            </span>
            <span className={cn('text-[13px] font-medium', atual ? 'text-foreground' : 'text-text-2')}>{item.label}</span>
            {indice < PASSOS.length - 1 && <span className="mx-0.5 block h-px w-6 bg-border" />}
          </div>
        )
      })}
    </div>
  )
}

// RF-05 a RF-12 — fluxo de importação, os 3 passos do protótipo aprovado: dados → revisão linha
// a linha (RF-08, regra que gerou cada prazo) → prévia agregada + confirmação (RF-10/RF-11).
export const ImportarLoteWizard = () => {
  const [passo, setPasso] = useState<Passo>('dados')
  const [pedido, setPedido] = useState<{ etapa: Etapa; linhaDeCorte: string; linhas: ReturnType<typeof parseCsv> } | null>(null)
  const [resumo, setResumo] = useState<ResumoImportacao | null>(null)
  const navigate = useNavigate()

  const preVisualizar = usePreVisualizarLote()
  const confirmar = useConfirmarLote()

  const handleContinuar = ({ etapa, linhaDeCorte, texto }: { etapa: Etapa; linhaDeCorte: string; texto: string }) => {
    const linhasCsv = parseCsv(texto)
    const linhas = paraRequestLinhas(linhasCsv)

    preVisualizar.mutate(
      { etapa, linhaDeCorte, linhas },
      {
        onSuccess: (dados) => {
          setPedido({ etapa, linhaDeCorte, linhas: linhasCsv })
          setResumo(dados)
          setPasso('revisao')
        },
      },
    )
  }

  const handleConfirmar = () => {
    if (!pedido) return
    const linhas = paraRequestLinhas(pedido.linhas)

    confirmar.mutate(
      { etapa: pedido.etapa, linhaDeCorte: pedido.linhaDeCorte, linhas },
      { onSuccess: () => setPasso('concluido') },
    )
  }

  return (
    <div className="max-w-[880px]">
      {passo !== 'concluido' && <IndicadorDePassos passo={passo} />}

      {passo === 'dados' && (
        <PassoDados onContinuar={handleContinuar} carregando={preVisualizar.isPending} erro={preVisualizar.isError ? 'Não foi possível ler o relatório. Confira o formato das linhas.' : null} />
      )}

      {passo === 'revisao' && resumo && pedido && (
        <PassoLinhas
          resumo={resumo}
          etapa={pedido.etapa}
          linhaDeCorte={pedido.linhaDeCorte}
          onVoltar={() => setPasso('dados')}
          onContinuar={() => setPasso('distribuicao')}
        />
      )}

      {passo === 'distribuicao' && resumo && pedido && (
        <PassoPrevia
          resumo={resumo}
          etapa={pedido.etapa}
          linhaDeCorte={pedido.linhaDeCorte}
          onVoltar={() => setPasso('revisao')}
          onConfirmar={handleConfirmar}
          confirmando={confirmar.isPending}
        />
      )}

      {passo === 'concluido' && resumo && (
        <div className="rounded-xl border border-ok-border bg-ok-bg p-8 text-center">
          <div className="text-[15px] font-semibold text-ok-fg">Lote importado — {resumo.processadas} protocolos distribuídos.</div>
          <Button className="mt-4" onClick={() => navigate(ROUTES.distribuicao)}>
            Ver distribuição
          </Button>
        </div>
      )}
    </div>
  )
}
