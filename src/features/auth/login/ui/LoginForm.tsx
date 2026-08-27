import { type FormEvent, useState } from 'react'

import { Button } from '@/shared/ui/Button'

import { useLogin } from '../model/use-login'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const { mutate, isPending, isError } = useLogin()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutate({ email, senha })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="senha" className="text-sm font-medium text-zinc-700">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          required
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      {isError && <p className="text-sm text-red-600">E-mail ou senha incorretos.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
