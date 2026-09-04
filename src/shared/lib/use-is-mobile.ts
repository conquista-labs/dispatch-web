import { useEffect, useState } from 'react'

// RNF-13/RF-24g — só pra quando a árvore/quantidade de itens renderizados muda de verdade
// (sidebar↔barra de chips, 3 colunas↔abas). Ajuste puramente visual (grid-cols, wrap) usa a
// classe `max-mobile:` direto (gerada por --breakpoint-mobile em app/styles/index.css), sem
// precisar deste hook — mais barato, sem re-render. O número (760) tem que bater com o CSS.
const CONSULTA = '(max-width: 759.98px)'

export const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.matchMedia(CONSULTA).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(CONSULTA)
    const listener = () => setMobile(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [])

  return mobile
}
