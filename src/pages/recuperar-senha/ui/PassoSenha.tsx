import { avaliarRegrasSenha } from '../lib/regras-senha'

type PassoSenhaProps = {
  senha1: string
  onSenha1Change: (senha: string) => void
  senha2: string
  onSenha2Change: (senha: string) => void
}

// Etapa 3 de 3 (RF-01g/RF-01j) — extraído de RecuperarSenhaPage.tsx.
export const PassoSenha = ({ senha1, onSenha1Change, senha2, onSenha2Change }: PassoSenhaProps) => {
  const regras = avaliarRegrasSenha(senha1, senha2)

  return (
    <div className="mt-[18px] flex flex-col gap-3">
      <div>
        <label htmlFor="rec-senha1" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
          Nova senha
        </label>
        <input
          id="rec-senha1"
          type="password"
          value={senha1}
          onChange={(event) => onSenha1Change(event.target.value)}
          className="w-full rounded-[7px] border border-border bg-card px-2.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="rec-senha2" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
          Repita a nova senha
        </label>
        <input
          id="rec-senha2"
          type="password"
          value={senha2}
          onChange={(event) => onSenha2Change(event.target.value)}
          className="w-full rounded-[7px] border bg-card px-2.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
          style={{ borderColor: senha2 && senha1 !== senha2 ? 'var(--bad-bd2)' : 'var(--line)' }}
        />
      </div>
      <div className="flex flex-col gap-[5px] rounded-lg border border-border bg-background p-[11px]">
        {regras.map((r) => (
          <span key={r.label} className="flex items-center gap-2" style={{ color: r.ok ? 'var(--text-3)' : 'var(--muted)' }}>
            <span
              className="flex size-[13px] flex-none items-center justify-center rounded-full border-[1.5px]"
              style={{ borderColor: r.ok ? 'var(--foreground)' : 'var(--d4)', background: r.ok ? 'var(--foreground)' : 'transparent' }}
            >
              {r.ok && <span className="block size-[5px] rounded-full bg-background" />}
            </span>
            <span className="text-xs">{r.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
