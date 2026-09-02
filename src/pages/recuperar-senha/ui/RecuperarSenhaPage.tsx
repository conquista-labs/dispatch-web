import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIniciarRecuperacao } from '@/features/auth/iniciar-recuperacao'
import { useRedefinirSenha } from '@/features/auth/redefinir-senha'
import { useValidarCodigoRecuperacao } from '@/features/auth/validar-codigo-recuperacao'
import { ROUTES } from '@/shared/config/routes'
import { Logo } from '@/shared/ui/logo'

import { avaliarRegrasSenha } from '../lib/regras-senha'
import { PassoCodigo } from './PassoCodigo'
import { PassoIdentificacao } from './PassoIdentificacao'
import { PassoOk } from './PassoOk'
import { PassoSenha } from './PassoSenha'

type Passo = 'ident' | 'codigo' | 'senha' | 'ok'

const PASSOS: Passo[] = ['ident', 'codigo', 'senha']

const TEXTOS: Record<Passo, [string, string, string]> = {
  ident: ['ETAPA 1 DE 3', 'Recuperar acesso', 'Informe o e-mail da sua conta. Nada é enviado por mensagem — a prova de identidade vem do seu app autenticador.'],
  codigo: ['ETAPA 2 DE 3', 'Código do autenticador', 'Abra o app no celular e digite o código de 6 dígitos que ele mostra para o Dispatch.'],
  senha: ['ETAPA 3 DE 3', 'Defina a nova senha', 'Escolha uma frase longa e fácil de lembrar. Comprimento protege mais que símbolos.'],
  ok: ['CONCLUÍDO', 'Senha alterada', 'Você já pode entrar com a senha nova.'],
}

const BOTAO_LABEL: Record<Passo, string> = {
  ident: 'Continuar',
  codigo: 'Validar código',
  senha: 'Salvar nova senha',
  ok: 'Ir para o login',
}

// Achado numa auditoria de qualidade: `pronto`/`botaoLabel` eram ternários encadeados de 4
// ramos reimplementando, na mão, o mesmo mapeamento que TEXTOS já resolve como tabela — viraram
// Record também.
type MutationComErro = { isError: boolean; error: unknown }

// Extraída de um `if` aninhado dentro de uma IIFE (achado na mesma auditoria) — mesma lógica,
// só com `if`s sequenciais em vez de aninhados.
const mensagemDeErro = (passo: Passo, validarCodigo: MutationComErro, redefinir: MutationComErro): string | null => {
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
}

// RF-01g-l. Mesma semântica de 4 etapas do protótipo (ident → código → senha → ok), sem o
// "Não tenho o app" (RF-01m — fora de escopo desta rodada, ver CLAUDE.md/plano: não existe
// exceção pra quem não registrou o autenticador ainda). Cada etapa é seu próprio arquivo
// (Passo*.tsx) — extraído de um componente único de ~270 linhas numa auditoria de qualidade,
// mesmo padrão já usado em widgets/importar-lote-wizard.
export const RecuperarSenhaPage = () => {
  const navigate = useNavigate()
  const [passo, setPasso] = useState<Passo>('ident')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [senha1, setSenha1] = useState('')
  const [senha2, setSenha2] = useState('')
  const [tokenRecuperacao, setTokenRecuperacao] = useState('')

  const iniciar = useIniciarRecuperacao()
  const validarCodigo = useValidarCodigoRecuperacao()
  const redefinir = useRedefinirSenha()

  const emailOk = email.trim().length > 3
  const codigoOk = /^\d{6}$/.test(codigo)
  const senhaOk = avaliarRegrasSenha(senha1, senha2).every((r) => r.ok)
  const PRONTO: Record<Passo, boolean> = { ident: emailOk, codigo: codigoOk, senha: senhaOk, ok: true }

  const erro = mensagemDeErro(passo, validarCodigo, redefinir)
  const pronto = PRONTO[passo]
  const carregando = iniciar.isPending || validarCodigo.isPending || redefinir.isPending

  const avancar = () => {
    if (passo === 'ok') return navigate(ROUTES.login)
    if (!pronto || carregando) return

    if (passo === 'ident') {
      iniciar.mutate({ email }, { onSuccess: () => setPasso('codigo') })
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
      redefinir.mutate({ tokenRecuperacao, novaSenha: senha1 }, { onSuccess: () => setPasso('ok') })
    }
  }

  const voltar = () => {
    if (passo === 'ident') return navigate(ROUTES.login)
    const idx = PASSOS.indexOf(passo)
    setPasso(PASSOS[Math.max(0, idx - 1)])
  }

  const [etapaLabel, titulo, sub] = TEXTOS[passo]
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

            {passo === 'ident' && <PassoIdentificacao email={email} onEmailChange={setEmail} />}
            {passo === 'codigo' && <PassoCodigo codigo={codigo} onCodigoChange={setCodigo} temErro={!!erro} />}
            {passo === 'senha' && <PassoSenha senha1={senha1} onSenha1Change={setSenha1} senha2={senha2} onSenha2Change={setSenha2} />}
            {passo === 'ok' && <PassoOk />}

            {erro && <div className="mt-3.5 rounded-lg border border-bad-border bg-bad-bg p-2.5 text-[12.5px] leading-normal text-bad-fg">{erro}</div>}

            <button
              type="button"
              onClick={avancar}
              disabled={passo !== 'ok' && (!pronto || carregando)}
              className="mt-[18px] w-full rounded-[7px] bg-primary py-[11px] text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {carregando ? 'Só um instante…' : BOTAO_LABEL[passo]}
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
