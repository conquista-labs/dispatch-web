import { isAxiosError } from 'axios'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { avaliarRegrasSenha, CamposNovaSenha, roleHomeRoute, useSessionStore } from '@/entities/usuario'
import { LogoutButton } from '@/features/auth/logout'
import { useTrocarSenha } from '@/features/auth/trocar-senha'
import { ROUTES } from '@/shared/config/routes'
import { Logo } from '@/shared/ui/logo'

const mensagemDeErro = (erro: unknown): string => {
  const codigo = isAxiosError(erro) ? erro.response?.data?.codigo : undefined
  if (codigo === 'senha_atual_incorreta') return 'A senha inicial não confere. Use a que você recebeu da administração.'
  if (codigo === 'senha_fraca') return 'A nova senha não atende as regras abaixo.'
  return 'Não foi possível trocar a senha agora. Tente de novo em instantes.'
}

// RF-45 — conta criada pela administração (ou conferente cadastrado) entra com uma senha inicial
// e é obrigada a trocar antes de usar o sistema. O bloqueio de verdade é no servidor (o token só
// vale pra /auth/me e /auth/trocar-senha — dispatch-api ADR-0040); aqui é a tela pra onde as
// guardas de rota mandam. Mesmo cartão da recuperação de senha; o protótipo não tem esta tela.
export const TrocarSenhaPage = () => {
  const usuario = useSessionStore((state) => state.usuario)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senha1, setSenha1] = useState('')
  const [senha2, setSenha2] = useState('')
  const trocar = useTrocarSenha()

  if (!usuario) return <Navigate to={ROUTES.login} replace />
  // Também é o caminho de saída: quando a troca dá certo, a sessão perde a marca e a própria
  // guarda leva pra tela inicial.
  if (!usuario.trocarSenha) return <Navigate to={roleHomeRoute[usuario.papeis[0]]} replace />

  const pronto = senhaAtual.length > 0 && avaliarRegrasSenha(senha1, senha2).every((r) => r.ok)

  const salvar = () => {
    if (!pronto || trocar.isPending) return
    trocar.mutate({ senhaAtual, novaSenha: senha1 })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-[18px]">
      <div className="w-full max-w-[428px]">
        <div className="mb-[22px] flex items-center gap-2.5">
          <Logo variant="on-light" size="md" />
          <span className="text-[16px] font-semibold tracking-[-0.015em]">Dispatch</span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            salvar()
          }}
          className="overflow-hidden rounded-xl border border-border bg-card p-[22px] shadow-sm"
        >
          <div className="font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted-foreground">
            PRIMEIRO ACESSO
          </div>
          <h1 className="mt-1.5 text-[19px] font-semibold tracking-[-0.02em] text-balance">
            Olá, {usuario.nome.split(' ')[0]}. Troque a senha inicial
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-pretty text-muted-foreground">
            A senha que você recebeu serve só para entrar a primeira vez. Escolha uma frase longa e fácil de lembrar —
            comprimento protege mais que símbolos.
          </p>

          <div className="mt-[18px]">
            <label htmlFor="troca-atual" className="mb-1.5 block text-[12.5px] font-medium text-text-4">
              Senha inicial
            </label>
            <input
              id="troca-atual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(event) => setSenhaAtual(event.target.value)}
              className="w-full rounded-[7px] border border-border bg-card px-2.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
            />
          </div>

          <CamposNovaSenha
            idPrefixo="troca"
            senha1={senha1}
            onSenha1Change={setSenha1}
            senha2={senha2}
            onSenha2Change={setSenha2}
          />

          {trocar.isError && (
            <div
              role="alert"
              className="mt-3.5 rounded-lg border border-bad-border bg-bad-bg p-2.5 text-[12.5px] leading-normal text-bad-fg"
            >
              {mensagemDeErro(trocar.error)}
            </div>
          )}

          <button
            type="submit"
            disabled={!pronto || trocar.isPending}
            className="mt-[18px] w-full rounded-[7px] bg-primary py-[11px] text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {trocar.isPending ? 'Só um instante…' : 'Salvar e entrar'}
          </button>

          <div className="mt-3.5 flex justify-center">
            <LogoutButton className="w-auto p-0.5 text-center font-medium" />
          </div>
        </form>

        <p className="mt-4 px-0.5 text-[11.5px] leading-[1.55] text-pretty text-muted-foreground">
          Trocar a senha encerra as outras sessões abertas com a senha inicial.
        </p>
      </div>
    </div>
  )
}
