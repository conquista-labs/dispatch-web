import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useVisaoDistribuicao } from '@/entities/protocolo'
import { useRedistribuirPool } from '@/features/protocolo/redistribuir-pool'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'
import { DistribuicaoBoard } from '@/widgets/distribuicao-board'
import { ProtocoloManualDialog } from '@/widgets/protocolo-manual'

// RF-13 a RF-18.
export const DistribuicaoPage = () => {
  const { data: visao } = useVisaoDistribuicao()
  const redistribuir = useRedistribuirPool()
  const navigate = useNavigate()
  const [novoProtocoloAberto, setNovoProtocoloAberto] = useState(false)

  const ativos = visao ? visao.pool.length + visao.atribuidos.length + visao.emConferencia.length : 0
  const vencidos = visao
    ? [...visao.pool, ...visao.atribuidos, ...visao.emConferencia].filter((p) => p.semaforo === 'Vermelho').length
    : 0

  return (
    <div className="px-7 pt-6 pb-7">
      {/* RNF-13 — "cabeçalhos quebram em linha" abaixo de 760px: sem flex-wrap aqui, os 3
          botões (Redistribuir pool/Novo protocolo/Importar relatório) nunca cabiam ao lado do
          título em tela estreita e estouravam a página inteira, arrastando até a barra de
          navegação fixa (mesmo tipo de bug achado no protótipo aprovado, seção Central de
          Regras → Alçada → Camadas). */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Distribuição</h1>
          {visao && (
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {ativos} protocolos ativos · {visao.pool.length} no pool · {visao.emConferencia.length} em conferência ·{' '}
              {vencidos > 0 ? `${vencidos} com prazo estourado` : 'nenhum prazo estourado'}
            </p>
          )}
        </div>
        <div className="flex flex-none flex-wrap gap-2 max-mobile:w-full">
          {/* RF-16: indicador de carregamento no próprio botão — já tinha disabled, faltava o
              feedback visual de "está rodando" (spinner + texto muda). */}
          <Button variant="outline" onClick={() => redistribuir.mutate()} disabled={redistribuir.isPending}>
            {redistribuir.isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {redistribuir.isPending ? 'Redistribuindo…' : 'Redistribuir pool'}
          </Button>
          <Button variant="outline" onClick={() => setNovoProtocoloAberto(true)}>
            Novo protocolo
          </Button>
          <Button onClick={() => navigate(ROUTES.importar)}>Importar relatório</Button>
        </div>
      </div>

      <div className="mt-4">
        <DistribuicaoBoard />
      </div>

      <ProtocoloManualDialog aberto={novoProtocoloAberto} onFechar={() => setNovoProtocoloAberto(false)} />
    </div>
  )
}
