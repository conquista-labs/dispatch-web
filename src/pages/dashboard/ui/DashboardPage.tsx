import { useEhAdministrador, useSessionStore } from '@/entities/usuario'
import { DashboardBoard } from '@/widgets/dashboard-board'

// RF-42-46. Textos do protótipo aprovado (Dispatch v2, `subIndicadores`); largura limitada a 1040px
// como lá — em tela larga a tabela e os cards não esticam sem fim.
export const DashboardPage = () => {
  const souGestao = useSessionStore((s) => s.usuario?.papeis.includes('Distribuidora') ?? false)
  const ehAdministrador = useEhAdministrador()

  const subtitulo = souGestao
    ? ehAdministrador
      ? 'Produtividade, prazo e qualidade — a base do cálculo de bonificação.'
      : 'Produtividade, prazo e qualidade da equipe no período.'
    : 'Seus números do período: volume, prazo e qualidade do que você conferiu.'

  return (
    <div className="max-w-[1040px] px-7 pt-6 pb-7 max-mobile:px-3.5 max-mobile:pt-4">
      <DashboardBoard titulo={souGestao ? 'Dashboard' : 'Meu dashboard'} subtitulo={subtitulo} souGestao={souGestao} />
    </div>
  )
}
