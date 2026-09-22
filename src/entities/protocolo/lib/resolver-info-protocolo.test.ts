import { describe, expect, it } from 'vitest'

import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'
import type { TipoAto } from '@/entities/tipoAto'

import type { ProtocoloResumo } from '../model/types'
import { criarResolverInfoProtocolo } from './resolver-info-protocolo'

const protocoloBase: ProtocoloResumo = {
  id: 'p1',
  numero: '123',
  tipoAtoId: null,
  escreventeId: 'e1',
  etapa: 'PreConferencia',
  prioridade: 'Normal',
  status: 'Pool',
  donoId: null,
  vencimentoEm: null,
  motivoExcecao: null,
  observacao: null,
  semaforo: null,
  iniciadoEm: null,
  pausadoEm: null,
  concluidoEm: null,
  duracao: null,
  andamentoEm: '2026-01-01T00:00:00Z',
}

const equipes: Equipe[] = [{ id: 'eq1', nome: 'Equipe RIO', prazoPreConferencia: 'D1', prazoPosConferencia: 'D1' }]
const tiposAto: TipoAto[] = [{ id: 't1', nome: 'Venda e Compra', ativo: true, grupo: null }]

// RF-14: o resolver mais reaproveitado do app (DistribuicaoBoard/MinhaFilaBoard/
// FilaDoConferenteBoard/PainelDetalheProtocolo/ListaCompletaPoolSheet) — cada um cruza os ids
// crus do protocolo com escreventes/equipes/tiposAto já buscados.
describe('criarResolverInfoProtocolo', () => {
  it('resolve tipo de ato, escrevente e equipe quando tudo existe', () => {
    const escreventes: Escrevente[] = [{ id: 'e1', nome: 'Escrevente A', equipeId: 'eq1' }]
    const { resolverInfo } = criarResolverInfoProtocolo(escreventes, equipes, tiposAto)

    const info = resolverInfo({ ...protocoloBase, tipoAtoId: 't1' })

    expect(info).toEqual({
      tipoAtoNome: 'Venda e Compra',
      escreventeNome: 'Escrevente A',
      equipeId: 'eq1',
      equipeNome: 'Equipe RIO',
    })
  })

  it('escrevente sem equipe resolve equipeId e equipeNome como null (não "carregando")', () => {
    const escreventes: Escrevente[] = [{ id: 'e1', nome: 'Escrevente A', equipeId: null }]
    const { resolverInfo } = criarResolverInfoProtocolo(escreventes, equipes, tiposAto)

    const info = resolverInfo(protocoloBase)

    expect(info.equipeId).toBeNull()
    expect(info.equipeNome).toBeNull()
  })

  it('tipoAtoId nulo (RF-09, tipo desconhecido) resolve tipoAtoNome como null, sem tentar buscar', () => {
    const { resolverInfo } = criarResolverInfoProtocolo([], equipes, tiposAto)

    const info = resolverInfo({ ...protocoloBase, escreventeId: 'inexistente', tipoAtoId: null })

    expect(info.tipoAtoNome).toBeNull()
  })

  it('escreventeId sem correspondência (dado ainda não chegou) resolve tudo como null, sem lançar', () => {
    const { resolverInfo } = criarResolverInfoProtocolo([], equipes, tiposAto)

    const info = resolverInfo({ ...protocoloBase, escreventeId: 'sumiu', tipoAtoId: 't1' })

    expect(info).toEqual({ tipoAtoNome: 'Venda e Compra', escreventeNome: null, equipeId: null, equipeNome: null })
  })

  it('listas undefined (query ainda não resolveu) não lançam — tudo vira null', () => {
    const { resolverInfo } = criarResolverInfoProtocolo(undefined, undefined, undefined)

    const info = resolverInfo({ ...protocoloBase, tipoAtoId: 't1' })

    expect(info).toEqual({ tipoAtoNome: null, escreventeNome: null, equipeId: null, equipeNome: null })
  })
})
