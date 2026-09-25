import { isAxiosError } from 'axios'

import { type Conta, ehTravaDeDesativacao, MOTIVO_DA_TRAVA, travaDeDesativacao } from '@/entities/conta'
import { useDesativarConta } from '@/features/conta/desativar'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'

type DesativarContaDialogProps = {
  conta: Conta | null
  contas: Conta[]
  onFechar: () => void
}

const primeiroNome = (nome: string) => nome.split(' ')[0]

// RF-46/RF-47 — dois estados, como no protótipo aprovado: a confirmação normal, ou, quando uma
// trava impede, o aviso com um "Entendi" só. A trava é lida da lista pra abrir já no aviso; um
// 409 do back (lista velha) cai no mesmo aviso.
export const DesativarContaDialog = ({ conta, contas, onFechar }: DesativarContaDialogProps) => {
  const desativar = useDesativarConta()

  if (!conta) return null

  const codigoDoBack = isAxiosError(desativar.error) ? desativar.error.response?.data?.codigo : undefined
  const trava = travaDeDesativacao(conta, contas) ?? (ehTravaDeDesativacao(codigoDoBack) ? codigoDoBack : null)
  const nome = primeiroNome(conta.nome)

  const fechar = (aberto: boolean) => {
    if (aberto) return
    desativar.reset()
    onFechar()
  }

  return (
    <AlertDialog open onOpenChange={fechar}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-pretty">
            {trava ? `Não é possível desativar ${conta.nome}` : `Desativar a conta de ${conta.nome}?`}
          </AlertDialogTitle>
          {trava ? (
            <div
              role="alert"
              className="mt-1 flex gap-2.5 rounded-[9px] border border-warn-border bg-warn-bg px-3 py-2.5 text-left"
            >
              <span className="flex size-[18px] flex-none items-center justify-center rounded-full border-[1.5px] border-warn-fg text-[12px] font-bold text-warn-fg">
                !
              </span>
              <AlertDialogDescription className="text-[13px] leading-normal text-pretty text-warn-fg-2">
                {MOTIVO_DA_TRAVA[trava](conta)}
              </AlertDialogDescription>
            </div>
          ) : (
            <AlertDialogDescription className="text-pretty">
              {nome} deixa de conseguir entrar no Dispatch. O histórico e as regras que {nome} criou continuam.
              {conta.tambemConfere && ` Os protocolos que estão com ${nome} voltam para o pool.`}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {!trava && desativar.isError && (
          <p role="alert" className="text-[13px] text-bad-fg">
            Não foi possível desativar. Tente de novo.
          </p>
        )}

        <AlertDialogFooter>
          {trava ? (
            <Button onClick={() => fechar(false)}>Entendi</Button>
          ) : (
            <>
              <AlertDialogCancel disabled={desativar.isPending}>Cancelar</AlertDialogCancel>
              <Button
                variant="outline"
                className="border-bad-border bg-bad-bg font-semibold text-bad-fg hover:bg-bad-bg hover:text-bad-fg"
                disabled={desativar.isPending}
                onClick={() => desativar.mutate(conta.id, { onSuccess: () => fechar(false) })}
              >
                {desativar.isPending ? 'Desativando…' : 'Desativar conta'}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
