import { useEffect, useState } from 'react'

type PassoCodigoProps = {
  codigo: string
  onCodigoChange: (codigo: string) => void
  temErro: boolean
}

// Etapa 2 de 3 (RF-01g/RF-01i) — extraído de RecuperarSenhaPage.tsx. O contador de 30s é
// puramente cosmético (lembrar que o código do autenticador muda a cada 30s) e não depende de
// mais nada da página — por isso o `tick`/efeito moram aqui dentro, não no componente pai
// (mesmo raciocínio de SeletorEtapa em PassoDados.tsx, que também tem estado só seu).
export const PassoCodigo = ({ codigo, onCodigoChange, temErro }: PassoCodigoProps) => {
  // Inicializador preguiçoso (função, não valor) — Date.now() só roda na montagem, não em
  // todo render (achado ligando mais categorias do oxlint: react(purity) reclamava de chamar
  // função impura direto no corpo do componente).
  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const janela = 30 - (Math.floor(tick / 1000) % 30)
  const apertado = janela <= 7

  return (
    <div className="mt-[18px]">
      <div className="mb-1.5 flex items-baseline justify-between gap-2.5">
        <label htmlFor="rec-codigo" className="text-[12.5px] font-medium text-text-4">
          Código de 6 dígitos
        </label>
        <span
          className="font-mono text-[11px] font-medium"
          style={{ color: apertado ? 'var(--warn-fg)' : 'var(--text-2)' }}
        >
          expira em {janela}s
        </span>
      </div>
      <input
        id="rec-codigo"
        value={codigo}
        onChange={(event) => onCodigoChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full rounded-lg border bg-card py-[13px] text-center font-mono text-2xl font-semibold tracking-[0.32em] text-foreground outline-none focus:border-primary"
        style={{ borderColor: temErro ? 'var(--bad-bd2)' : 'var(--line)' }}
      />
      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-secondary">
        <span
          className="block h-full"
          style={{
            width: `${Math.round((janela / 30) * 100)}%`,
            background: apertado ? 'var(--warn-fg)' : 'var(--text-2)',
          }}
        />
      </div>
    </div>
  )
}
