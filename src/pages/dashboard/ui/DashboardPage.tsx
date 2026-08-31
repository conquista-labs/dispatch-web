import { useSessionStore } from '@/entities/usuario'
import { DashboardBoard } from '@/widgets/dashboard-board'

// RF-42-46.
export const DashboardPage = () => {
  const souGestao = useSessionStore((s) => s.usuario?.papel) === 'Distribuidora'

  return (
    <div className="px-7 pt-6 pb-7">
      <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">{souGestao ? 'Dashboard' : 'Meu dashboard'}</h1>
      <p className="mt-1.5 max-w-[66ch] text-[13.5px] text-muted-foreground text-pretty">
        {souGestao
          ? 'Volume, prazo, qualidade e complexidade de toda a operação, com o score que decide a bonificação.'
          : 'Seus números do período: volume, prazo e qualidade do que você conferiu.'}
      </p>

      <div className="mt-4">
        <DashboardBoard souGestao={souGestao} />
      </div>
    </div>
  )
}
