import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

import { roleHomeRoute, useSessionStore } from '@/entities/usuario'
import { LoginForm } from '@/features/auth/login'
import { useConfirmarTotp } from '@/features/auth/confirmar-totp'
import { useRegistrarTotp } from '@/features/auth/registrar-totp'
import { ROUTES } from '@/shared/config/routes'
import { Logo } from '@/shared/ui/logo'

// RF-01a-d. Divergência deliberada do protótipo: lá "Registrar autenticador" pula direto pro QR
// (mock sem back de verdade). Aqui o back exige uma sessão real pra saber a QUEM o segredo TOTP
// pertence (`POST /auth/totp/registrar` é autenticado, de propósito — senão qualquer um
// registraria um autenticador pra um e-mail alheio) — então a página pede login primeiro
// (reaproveita o próprio <LoginForm/>) e só then mostra o QR. Ver CLAUDE.md.
export const RegistrarTotpPage = () => {
  const usuario = useSessionStore((state) => state.usuario)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-[18px]">
      <div className="w-full max-w-[452px]">
        <div className="mb-[22px] flex items-center gap-2.5">
          <Logo variant="on-light" size="md" />
          <span className="text-[16px] font-semibold tracking-[-0.015em]">Dispatch</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-[22px] shadow-sm">
          {usuario ? (
            <RegistroTotp email={usuario.email} papel={usuario.papel} />
          ) : (
            <>
              <div className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground">PRIMEIRO ACESSO</div>
              <h1 className="mt-1.5 text-[19px] font-semibold tracking-[-0.02em] text-balance">Entre para registrar seu autenticador</h1>
              <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground text-pretty">
                Confirme sua senha antes de configurar o autenticador — é assim que provamos que é você.
              </p>
              <div className="mt-[18px]">
                <LoginForm mostrarLinksAuxiliares={false} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const RegistroTotp = ({ email, papel }: { email: string; papel: 'Distribuidora' | 'Conferente' }) => {
  const navigate = useNavigate()
  const registrar = useRegistrarTotp()
  const confirmar = useConfirmarTotp()
  const [codigo, setCodigo] = useState('')
  const jaChamou = useRef(false)

  useEffect(() => {
    if (jaChamou.current) return
    jaChamou.current = true
    registrar.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const codigoValido = /^\d{6}$/.test(codigo)
  const feito = confirmar.isSuccess

  const handleConfirmar = () => {
    if (feito) {
      navigate(roleHomeRoute[papel])
      return
    }
    if (!codigoValido) return
    confirmar.mutate({ codigo })
  }

  if (registrar.isPending || !registrar.data) {
    return <p className="mt-4 text-[13px] text-muted-foreground">Gerando o segredo…</p>
  }

  if (registrar.isError) {
    return <p className="mt-4 text-[13px] text-bad-fg">Não foi possível gerar o segredo agora. Tente de novo em instantes.</p>
  }

  const chaveEmBlocos = registrar.data.chaveBase32.match(/.{1,4}/g)?.join(' ') ?? registrar.data.chaveBase32

  return (
    <>
      <div className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground">PRIMEIRO ACESSO</div>
      <h1 className="mt-1.5 text-[19px] font-semibold tracking-[-0.02em] text-balance">Registre seu autenticador</h1>
      <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground text-pretty">
        Abra Google Authenticator, Authy ou 1Password no celular e leia o código abaixo. É assim que você recupera a senha
        sozinho depois, sem depender de ninguém.
      </p>

      <div className="mt-[18px] flex flex-wrap items-start gap-[18px]">
        <div className="flex-none rounded-[10px] border border-border bg-white p-3">
          <QRCodeSVG value={registrar.data.uriOtpAuth} size={150} />
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="text-xs font-semibold text-text-4">Sem câmera? Digite a chave</div>
          <div className="mt-[7px] rounded-[7px] border border-border bg-background p-2.5 font-mono text-[13px] leading-[1.6] font-medium break-all text-foreground">
            {chaveEmBlocos}
          </div>
          <div className="mt-2.5 text-[11.5px] leading-[1.5] text-muted-foreground">
            Conta: {email} · Dispatch
          </div>
        </div>
      </div>

      <div className="mt-[18px]">
        <label htmlFor="totp-codigo" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
          Confirme com o código que o app mostra
        </label>
        <input
          id="totp-codigo"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          disabled={feito}
          className="w-full rounded-lg border border-border bg-card py-[13px] text-center font-mono text-2xl font-semibold text-foreground outline-none tracking-[0.32em] focus:border-primary disabled:opacity-60"
        />
      </div>

      {confirmar.isError && (
        <div className="mt-3.5 rounded-lg border border-bad-border bg-bad-bg p-2.5 text-[12.5px] leading-normal text-bad-fg">
          {isAxiosError(confirmar.error) && confirmar.error.response?.status === 404
            ? 'O registro expirou. Recarregue a página e comece de novo.'
            : 'Código não confere. O relógio do celular precisa estar no horário automático.'}
        </div>
      )}
      {feito && (
        <div className="mt-3.5 rounded-lg border border-ok-border bg-ok-bg p-2.5 text-[12.5px] leading-normal text-ok-fg">
          Autenticador registrado. A partir de agora você recupera a senha sozinho, pelo app.
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirmar}
        disabled={!feito && (!codigoValido || confirmar.isPending)}
        className="mt-[18px] w-full rounded-[7px] bg-primary py-[11px] text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {feito ? 'Ir para o Dashboard' : confirmar.isPending ? 'Confirmando…' : 'Confirmar registro'}
      </button>
      {!feito && (
        <div className="mt-3.5 flex justify-center">
          <button type="button" onClick={() => navigate(ROUTES.login)} className="p-0.5 text-[12.5px] font-medium text-text-2 hover:text-foreground">
            Voltar para entrar
          </button>
        </div>
      )}

      <p className="mt-4 px-0.5 text-[11.5px] leading-[1.55] text-muted-foreground text-pretty">
        A chave fica só no seu celular. O Dispatch guarda dela apenas o necessário para validar o código — e não envia nada
        por e-mail ou SMS.
      </p>
    </>
  )
}
