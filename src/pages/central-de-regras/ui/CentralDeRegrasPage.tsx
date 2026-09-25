import { CentralDeRegrasBoard } from '@/widgets/central-de-regras-board'

// RF-31 a RF-41. O título e a navegação moram no board: em tela larga o título vai pra coluna da
// navegação lateral (protótipo v2), então não dá pra ficar fixo aqui em cima.
export const CentralDeRegrasPage = () => (
  <div className="px-7 pt-6 pb-7 max-mobile:px-3.5 max-mobile:pt-4">
    <CentralDeRegrasBoard />
  </div>
)
