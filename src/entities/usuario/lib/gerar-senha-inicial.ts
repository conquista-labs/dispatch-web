const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789'

const trecho = (tamanho: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho))
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('')
}

// Senha inicial no formato do botão "Gerar" do protótipo (`xxxx-xxxx-NN`, 12 caracteres, acima
// do mínimo de 8 do RF-45). `crypto.getRandomValues`, não `Math.random` — é uma credencial. O
// alfabeto tira l/o/0/1 pra não confundir quando for ditada ou copiada à mão.
export const gerarSenhaInicial = () => {
  const [a, b] = crypto.getRandomValues(new Uint8Array(2))
  const numero = 10 + (((a << 8) | b) % 90)
  return `${trecho(4)}-${trecho(4)}-${numero}`
}

// RF-45 — o mesmo mínimo do back (RegrasDeSenha.ServeComoSenhaInicial). Só pra habilitar o botão.
export const SENHA_INICIAL_MINIMA = 8
