import { useContas } from '@/entities/conta'
import { ContasBoard, NovaContaDialog, resumoDasContas } from '@/widgets/contas-board'

// 6.8 do documento v2 (RF-44 a RF-48) — só Administrador (guarda na rota e 403 no back).
export const ContasPage = () => {
  const { data: contas } = useContas()

  return (
    <div className="max-w-[880px] px-7 pt-6 pb-7 max-mobile:px-3.5 max-mobile:pt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Contas</h1>
          <p className="mt-1.5 max-w-[62ch] text-[13.5px] text-pretty text-text-2">
            Quem gerencia o Dispatch. Conferentes são cadastrados na tela Conferentes.
            {contas && ` ${resumoDasContas(contas)}.`}
          </p>
        </div>
        <NovaContaDialog />
      </div>

      <div className="mt-4">
        <ContasBoard />
      </div>
    </div>
  )
}
