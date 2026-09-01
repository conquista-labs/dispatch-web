import { useQuery } from '@tanstack/react-query'

import { simularProtocoloManual, type SimularProtocoloManualParams } from '../api/simular-protocolo-manual'

// RF-18f: prévia ao vivo, não só no submit — só dispara quando os campos que o back precisa
// pra rodar o motor já estão preenchidos (tipo e escrevente; número pode chegar vazio, o back
// só usa pra checar disponibilidade). `keepPreviousData`-like: como a query key muda a cada
// tecla, o React Query já mantém o último resultado visível enquanto a nova carrega
// (comportamento padrão, sem configuração extra).
export const useSimularProtocoloManual = (params: SimularProtocoloManualParams, habilitado: boolean) =>
  useQuery({
    queryKey: ['protocolos', 'manual', 'simular', params],
    queryFn: () => simularProtocoloManual(params),
    enabled: habilitado,
  })
