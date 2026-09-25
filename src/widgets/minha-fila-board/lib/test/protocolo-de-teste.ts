import type { ProtocoloResumo } from '@/entities/protocolo'

// Fixture dos testes deste widget (a terceira repetição do mesmo objeto virou helper).
export const protocoloDeTeste = (id: string, overrides: Partial<ProtocoloResumo> = {}): ProtocoloResumo => ({
  id,
  numero: id,
  tipoAtoId: 't1',
  escreventeId: 'e1',
  etapa: 'PosConferencia',
  prioridade: 'Normal',
  status: 'Pool',
  donoId: null,
  vencimentoEm: '2026-09-26T12:00:00Z',
  motivoExcecao: null,
  observacao: null,
  semaforo: 'Verde',
  iniciadoEm: null,
  pausadoEm: null,
  concluidoEm: null,
  duracao: null,
  andamentoEm: '2026-09-25T09:00:00Z',
  numeroDaConferencia: 1,
  ...overrides,
})
