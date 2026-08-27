import { ROUTES } from '@/shared/config/routes'

import type { Papel } from './types'

// RF-03: depois de logar, distribuidora cai em Distribuição e conferente em Minha fila. Fica
// na entidade (não em `app`) porque é indexado por Papel — tanto `pages/login` quanto
// `app/routing` precisam disso, e `pages` não pode importar de `app` (regra de dependência do
// FSD é sempre pra baixo). Quando "Subscritor" existir, é só mais uma linha aqui.
export const roleHomeRoute: Record<Papel, string> = {
  Distribuidora: ROUTES.distribuicao,
  Conferente: ROUTES.minhaFila,
}
