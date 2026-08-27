import { useEffect, useState } from 'react'

// "Agora" que atualiza sozinho — alimenta cronômetro (RF-21) e chip de prazo, que precisam
// recalcular sem esperar um refetch. Mesma ideia do tick de 1s do protótipo aprovado.
export const useNow = (intervalMs = 1000) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
