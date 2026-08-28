import { CentralDeRegrasBoard } from '@/widgets/central-de-regras-board'

// RF-31 a RF-41.
export const CentralDeRegrasPage = () => (
  <div className="px-7 pt-6 pb-7">
    <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Central de regras</h1>
    <p className="mt-1.5 max-w-[66ch] text-[13.5px] text-muted-foreground text-pretty">
      Tudo o que o sistema sabe sobre o cartório mora aqui: quem pode conferir cada tipo de ato, quem faz pré e pós-conferência, de que equipe é cada
      escrevente e que prazo isso gera. A cada importação ele compara o que previu com o que você fez e propõe ajustes — nada muda sem você aprovar.
    </p>

    <div className="mt-4">
      <CentralDeRegrasBoard />
    </div>
  </div>
)
