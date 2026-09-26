import { useMutation } from '@tanstack/react-query'

import { converterRelatorio } from '../api/converter-relatorio'

// Mutation só pelo ciclo de estado (pendente/erro) — não muda nada no servidor, então não invalida
// query nenhuma.
export const useConverterRelatorio = () => useMutation({ mutationFn: converterRelatorio })
