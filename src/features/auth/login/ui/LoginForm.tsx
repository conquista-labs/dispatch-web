import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { Button } from '@/shared/ui/button'

import { useLogin } from '../model/use-login'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const { mutate, isPending, isError } = useLogin()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutate({ email, senha })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email" className="block text-[12.5px] font-medium text-text-4">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-1.5 w-full rounded-[7px] border border-border bg-card px-2.5 py-2 text-[13.5px] text-foreground outline-none focus:border-primary"
      />

      <label htmlFor="senha" className="mt-3.5 block text-[12.5px] font-medium text-text-4">
        Senha
      </label>
      <div className="relative mt-1.5">
        <input
          id="senha"
          type={senhaVisivel ? 'text' : 'password'}
          required
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          className="w-full rounded-[7px] border border-border bg-card px-2.5 py-2 pr-9 text-[13.5px] text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => setSenhaVisivel((visivel) => !visivel)}
          // Evita a palavra "senha" de propósito — testes e2e usam getByLabel('Senha') pra
          // achar o campo, e getByLabel também acha elemento com aria-label batendo (mesmo
          // não sendo um <label>), o que colidia (2 elementos) e quebrava a suíte inteira.
          aria-label={senhaVisivel ? 'Ocultar caracteres digitados' : 'Mostrar caracteres digitados'}
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {senhaVisivel ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>

      {isError && <p className="mt-2 text-[12.5px] text-bad-fg">E-mail ou senha incorretos.</p>}

      <Button type="submit" disabled={isPending} className="mt-[22px] h-auto w-full rounded-[7px] py-2.5 text-sm">
        {isPending ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="mt-3.5 text-center text-xs text-muted-foreground">O papel vem do cadastro do usuário.</p>
    </form>
  )
}
