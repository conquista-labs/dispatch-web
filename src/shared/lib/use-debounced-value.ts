import { useEffect, useState } from 'react'

// Segura um valor que muda rápido (texto digitado) por um tempo antes de repassar adiante —
// pra busca que dispara requisição de verdade no back (paginação de Tipos de ato é o primeiro
// caso), evita um GET por tecla. Filtro client-side (busca + rolagem contida, usado no resto
// do app) não precisa disso — só filtra um array já em memória, sem custo de rede.
export const useDebouncedValue = <T>(valor: T, atrasoMs = 300): T => {
  const [valorComAtraso, setValorComAtraso] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setValorComAtraso(valor), atrasoMs)
    return () => clearTimeout(id)
  }, [valor, atrasoMs])

  return valorComAtraso
}
