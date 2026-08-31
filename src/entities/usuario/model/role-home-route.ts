import { ROUTES } from '@/shared/config/routes'

import type { Papel } from './types'

// RF-03, ajustado a pedido do dono: os dois papéis caem no Dashboard depois de logar (antes
// era Distribuição pra Distribuidora e Minha fila pra Conferente — RF-42-46 virou a primeira
// coisa que se quer ver ao entrar). Fica na entidade (não em `app`) porque é indexado por
// Papel — tanto `pages/login` quanto `app/routing` precisam disso, e `pages` não pode importar
// de `app` (regra de dependência do FSD é sempre pra baixo). Quando "Subscritor" existir, é só
// mais uma linha aqui.
export const roleHomeRoute: Record<Papel, string> = {
  Distribuidora: ROUTES.dashboard,
  Conferente: ROUTES.dashboard,
}
