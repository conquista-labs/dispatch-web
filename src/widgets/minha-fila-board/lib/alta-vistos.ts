// RF-24i — "o mesmo protocolo não avisa duas vezes na sessão". Os ids já vistos ficam no
// sessionStorage por usuário (sobrevive ao F5 — o protótipo guarda em memória e avisaria de novo
// depois de recarregar), e somem quando a aba fecha.

// A primeira leitura da sessão (nada gravado ainda) só registra o que já existe — sem toast: a
// faixa já mostra, e o protótipo também não avisa no login. Depois disso, é "novo" quem não
// estava no conjunto; um id que sai e volta (ou passa do pool pra "seu") não é novo.
export function diffAltas(vistos: string[] | null, atuais: string[]): { novos: string[]; vistos: string[] } {
  if (vistos === null) return { novos: [], vistos: atuais }
  const conhecidos = new Set(vistos)
  const novos = atuais.filter((id) => !conhecidos.has(id))
  return { novos, vistos: [...vistos, ...novos] }
}

const chave = (usuarioId: string) => `dispatch-alta-vistos:${usuarioId}`

// sessionStorage pode lançar (navegador bloqueando dado de site, modo privado antigo) — sem ele,
// o pior caso é repetir um toast, nunca quebrar a fila.
export function lerAltasVistos(usuarioId: string): string[] | null {
  try {
    const bruto = sessionStorage.getItem(chave(usuarioId))
    if (bruto === null) return null
    const lido: unknown = JSON.parse(bruto)
    return Array.isArray(lido) ? lido.filter((id): id is string => typeof id === 'string') : null
  } catch {
    return null
  }
}

export function gravarAltasVistos(usuarioId: string, ids: string[]): void {
  try {
    sessionStorage.setItem(chave(usuarioId), JSON.stringify(ids))
  } catch {
    // sem armazenamento: segue sem memória de sessão
  }
}
