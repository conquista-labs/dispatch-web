type PassoIdentificacaoProps = {
  email: string
  onEmailChange: (email: string) => void
}

// Etapa 1 de 3 (RF-01g) — extraído de RecuperarSenhaPage.tsx (achado numa auditoria de
// qualidade: as 4 etapas do assistente ficavam inline no mesmo componente, ~270 linhas; o app
// já tinha o padrão "um arquivo por etapa" em widgets/importar-lote-wizard/ui/).
export const PassoIdentificacao = ({ email, onEmailChange }: PassoIdentificacaoProps) => (
  <div className="mt-[18px]">
    <label htmlFor="rec-email" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
      Seu e-mail de acesso
    </label>
    <input
      id="rec-email"
      type="email"
      value={email}
      onChange={(event) => onEmailChange(event.target.value)}
      placeholder="nome@cartorio"
      className="w-full rounded-[7px] border border-border bg-card px-2.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
    />
  </div>
)
