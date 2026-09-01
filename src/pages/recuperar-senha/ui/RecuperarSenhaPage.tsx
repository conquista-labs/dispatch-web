import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIniciarRecuperacao } from '@/features/auth/iniciar-recuperacao'
import { useRedefinirSenha } from '@/features/auth/redefinir-senha'
import { useValidarCodigoRecuperacao } from '@/features/auth/validar-codigo-recuperacao'
import { ROUTES } from '@/shared/config/routes'
import { Logo } from '@/shared/ui/logo'

type Passo = 'ident' | 'codigo' | 'senha' | 'ok'

const PASSOS: Passo[] = ['ident', 'codigo', 'senha']

const TEXTOS: Record<Passo, [string, string, string]> = {
  ident: ['ETAPA 1 DE 3', 'Recuperar acesso', 'Informe o e-mail da sua conta. Nada é enviado por mensagem — a prova de identidade vem do seu app autenticador.'],
  codigo: ['ETAPA 2 DE 3', 'Código do autenticador', 'Abra o app no celular e digite o código de 6 dígitos que ele mostra para o Dispatch.'],
  senha: ['ETAPA 3 DE 3', 'Defina a nova senha', 'Escolha uma frase longa e fácil de lembrar. Comprimento protege mais que símbolos.'],
  ok: ['CONCLUÍDO', 'Senha alterada', 'Você já pode entrar com a senha nova.'],
}

const FEITOS = [
  'Senha nova em uso a partir de agora.',
  'Todas as sessões abertas foram encerradas.',
  'Atos que estavam em conferência com você voltaram ao pool.',
  'A distribuidora recebeu o registro na trilha de auditoria.',
]

// RF-01g-l. Mesma semântica de 4 etapas do protótipo (ident → código → senha → ok), sem o
// "Não tenho o app" (RF-01m — fora de escopo desta rodada, ver CLAUDE.md/plano: não existe
// exceção pra quem não registrou o autenticador ainda).
export const RecuperarSenhaPage = () => {
  const navigate = useNavigate()
  const [passo, setPasso] = useState<Passo>('ident')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [senha1, setSenha1] = useState('')
  const [senha2, setSenha2] = useState('')
  const [tokenRecuperacao, setTokenRecuperacao] = useState('')
  const [tick, setTick] = useState(Date.now())

  const iniciar = useIniciarRecuperacao()
  const validarCodigo = useValidarCodigoRecuperacao()
  const redefinir = useRedefinirSenha()

  useEffect(() => {
    if (passo !== 'codigo') return
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [passo])

  const janela = 30 - (Math.floor(tick / 1000) % 30)
  const apertado = janela <= 7

  const regras = [
    { label: 'Pelo menos 12 caracteres', ok: senha1.length >= 12 },
    { label: 'Não é uma senha óbvia', ok: senha1.length >= 12 && !/^(senha|123|cartorio|dispatch)/i.test(senha1) },
    { label: 'As duas iguais', ok: senha1.length > 0 && senha1 === senha2 },
  ]
  const senhaOk = regras.every((r) => r.ok)
  const codigoOk = /^\d{6}$/.test(codigo)
  const emailOk = email.trim().length > 3

  const erro = (() => {
    if (passo === 'codigo' && validarCodigo.isError) {
      if (isAxiosError(validarCodigo.error) && validarCodigo.error.response?.status === 423) {
        return 'Conta bloqueada por tentativas erradas. Espere alguns minutos e tente de novo.'
      }
      return 'Código inválido ou já usado. Confira se o app está no relógio certo e tente o próximo código.'
    }
    if (passo === 'senha' && redefinir.isError) {
      if (isAxiosError(redefinir.error) && redefinir.error.response?.status === 400) {
        return 'A senha não atende as regras abaixo.'
      }
      return 'O link de recuperação expirou. Volte e valide o código de novo.'
    }
    return null
  })()

  const pronto = passo === 'ident' ? emailOk : passo === 'codigo' ? codigoOk : passo === 'senha' ? senhaOk : true
  const carregando = iniciar.isPending || validarCodigo.isPending || redefinir.isPending

  const avancar = () => {
    if (passo === 'ok') return navigate(ROUTES.login)
    if (!pronto || carregando) return

    if (passo === 'ident') {
      iniciar.mutate(
        { email },
        { onSuccess: () => setPasso('codigo') },
      )
      return
    }
    if (passo === 'codigo') {
      validarCodigo.mutate(
        { email, codigo },
        { onSuccess: (data) => { setTokenRecuperacao(data.tokenRecuperacao); setPasso('senha') } },
      )
      return
    }
    if (passo === 'senha') {
      redefinir.mutate(
        { tokenRecuperacao, novaSenha: senha1 },
        { onSuccess: () => setPasso('ok') },
      )
    }
  }

  const voltar = () => {
    if (passo === 'ident') return navigate(ROUTES.login)
    const idx = PASSOS.indexOf(passo)
    setPasso(PASSOS[Math.max(0, idx - 1)])
  }

  const [etapaLabel, titulo, sub] = TEXTOS[passo]
  const botaoLabel = passo === 'ident' ? 'Continuar' : passo === 'codigo' ? 'Validar código' : passo === 'senha' ? 'Salvar nova senha' : 'Ir para o login'
  const nota =
    passo === 'codigo'
      ? 'O código muda a cada 30 segundos e só serve uma vez. Cinco tentativas erradas bloqueiam a conta por 15 minutos.'
      : 'O Dispatch não envia e-mail nem SMS para recuperar senha. Quem tem o autenticador registrado se recupera sozinho, a qualquer hora.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-[18px]">
      <div className="w-full max-w-[428px]">
        <div className="mb-[22px] flex items-center gap-2.5">
          <Logo variant="on-light" size="md" />
          <span className="text-[16px] font-semibold tracking-[-0.015em]">Dispatch</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex gap-1.5 px-[22px] pt-3.5">
            {PASSOS.map((p, i) => (
              <span
                key={p}
                className="block h-[3px] flex-1 rounded-full"
                style={{ background: passo === 'ok' ? 'var(--ok-fg)' : i <= PASSOS.indexOf(passo) ? 'var(--foreground)' : 'var(--secondary)' }}
              />
            ))}
          </div>

          <div className="p-[22px]">
            <div className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground">{etapaLabel}</div>
            <h1 className="mt-1.5 text-[19px] font-semibold tracking-[-0.02em] text-balance">{titulo}</h1>
            <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground text-pretty">{sub}</p>

            {passo === 'ident' && (
              <div className="mt-[18px]">
                <label htmlFor="rec-email" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
                  Seu e-mail de acesso
                </label>
                <input
                  id="rec-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@cartorio"
                  className="w-full rounded-[7px] border border-border bg-card px-2.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </div>
            )}

            {passo === 'codigo' && (
              <div className="mt-[18px]">
                <div className="mb-1.5 flex items-baseline justify-between gap-2.5">
                  <label htmlFor="rec-codigo" className="text-[12.5px] font-medium text-text-4">
                    Código de 6 dígitos
                  </label>
                  <span className="font-mono text-[11px] font-medium" style={{ color: apertado ? 'var(--warn-fg)' : 'var(--text-2)' }}>
                    expira em {janela}s
                  </span>
                </div>
                <input
                  id="rec-codigo"
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-lg border bg-card py-[13px] text-center font-mono text-2xl font-semibold text-foreground outline-none tracking-[0.32em] focus:border-primary"
                  style={{ borderColor: erro ? 'var(--bad-bd2)' : 'var(--line)' }}
                />
                <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full"
                    style={{ width: `${Math.round((janela / 30) * 100)}%`, background: apertado ? 'var(--warn-fg)' : 'var(--text-2)' }}
                  />
                </div>
              </div>
            )}

            {passo === 'senha' && (
              <div className="mt-[18px] flex flex-col gap-3">
                <div>
                  <label htmlFor="rec-senha1" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
                    Nova senha
                  </label>
                  <input
                    id="rec-senha1"
                    type="password"
                    value={senha1}
                    onChange={(event) => setSenha1(event.target.value)}
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
                    onChange={(event) => setSenha2(event.target.value)}
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
            )}

            {passo === 'ok' && (
              <div className="mt-[18px] flex flex-col gap-2">
                {FEITOS.map((label) => (
                  <span key={label} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-text-3">
                    <span className="mt-px flex size-[15px] flex-none items-center justify-center rounded-full border border-ok-border bg-ok-bg text-ok-fg">✓</span>
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            )}

            {erro && <div className="mt-3.5 rounded-lg border border-bad-border bg-bad-bg p-2.5 text-[12.5px] leading-normal text-bad-fg">{erro}</div>}

            <button
              type="button"
              onClick={avancar}
              disabled={passo !== 'ok' && (!pronto || carregando)}
              className="mt-[18px] w-full rounded-[7px] bg-primary py-[11px] text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {carregando ? 'Só um instante…' : botaoLabel}
            </button>

            {passo !== 'ok' && (
              <div className="mt-3.5 flex justify-center">
                <button type="button" onClick={voltar} className="p-0.5 text-[12.5px] font-medium text-text-2 hover:text-foreground">
                  {passo === 'ident' ? 'Voltar para entrar' : 'Voltar'}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 px-0.5 text-[11.5px] leading-[1.55] text-muted-foreground text-pretty">{nota}</p>
      </div>
    </div>
  )
}
