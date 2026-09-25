import { useState } from 'react'

import { type Conta, useContas } from '@/entities/conta'
import { cn } from '@/shared/lib/utils'
import { Carregando } from '@/shared/ui/carregando'

import { DesativarContaDialog } from './DesativarContaDialog'

const pilula = 'rounded-full border px-[9px] py-0.5 text-[11.5px] whitespace-nowrap'

// RF-44 — contas de gestão (administradores e distribuidoras). Conferente não aparece aqui: é
// cadastrado na tela Conferentes. Uma lista, sem busca — é gente contada nos dedos.
export const ContasBoard = () => {
  const { data: contas, isLoading } = useContas()
  const [desativando, setDesativando] = useState<Conta | null>(null)

  if (isLoading || !contas) return <Carregando />

  const soVoce = contas.length === 1 && contas[0].ehVoce

  return (
    <div>
      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-xs">
        {contas.map((conta) => (
          <div
            key={conta.id}
            data-testid={`conta-${conta.email}`}
            className={cn(
              'flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-t border-secondary px-4 py-3 first:border-t-0',
              !conta.ativo && 'opacity-60',
            )}
          >
            <div className="min-w-0 flex-[1_1_220px]">
              <div className="flex flex-wrap items-center gap-[7px]">
                <span className="text-[14px] font-semibold">{conta.nome}</span>
                {conta.ehVoce && <span className="text-[11px] text-muted-foreground">você</span>}
              </div>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className="min-w-0 font-mono text-[11.5px] break-all text-muted-foreground">{conta.email}</span>
                {conta.tambemConfere && (
                  <span className="flex-none text-[11.5px] whitespace-nowrap text-text-2">· também confere</span>
                )}
              </div>
            </div>

            <span
              className={cn(
                pilula,
                'flex-none',
                conta.papel === 'Administrador'
                  ? 'border-foreground bg-foreground font-semibold text-background'
                  : 'border-border bg-secondary font-medium text-text-3',
              )}
            >
              {conta.papel}
            </span>

            <div className="flex min-w-[176px] flex-none items-center justify-end gap-2 max-mobile:min-w-0">
              {conta.ativo ? (
                <>
                  <span className={cn(pilula, 'border-ok-border bg-ok-bg font-medium text-ok-fg')}>● Ativa</span>
                  <button
                    type="button"
                    onClick={() => setDesativando(conta)}
                    className="min-h-8 rounded-md border border-border bg-card px-[11px] text-[12px] font-medium text-text-2 hover:border-bad-border hover:bg-bad-bg hover:text-bad-fg"
                  >
                    Desativar
                  </button>
                </>
              ) : (
                <span className={cn(pilula, 'border-border bg-secondary font-medium text-text-2')}>○ Inativa</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {soVoce && (
        <div className="mt-3 rounded-[10px] border border-dashed border-border p-4 text-center">
          <div className="text-[13px] font-medium">Só você por enquanto</div>
          <div className="mt-1 text-[12.5px] text-pretty text-text-2">
            Crie uma conta de distribuidora para dividir a gestão — ou um segundo administrador, para a casa não
            depender de uma pessoa só.
          </div>
        </div>
      )}

      <p className="mt-3 text-[12.5px] text-pretty text-muted-foreground">
        Desativar tira o acesso, mas preserva o histórico. Ninguém desativa a própria conta, e sempre fica pelo menos um
        administrador ativo.
      </p>

      <DesativarContaDialog conta={desativando} contas={contas} onFechar={() => setDesativando(null)} />
    </div>
  )
}
