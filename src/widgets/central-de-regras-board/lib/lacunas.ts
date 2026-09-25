import type { AlcanceDoConferente, Conferente } from '@/entities/conferente'
import type { TipoAto } from '@/entities/tipoAto'

const NOMES_VISIVEIS = 4

// Aviso do topo da Matriz (protótipo v2, `matrizLacunas`): tipos ativos que ninguém da lista pode
// conferir e os que dependem de uma pessoa só. Derivado do alcance que o back já calcula — o front
// só inverte "o que cada pessoa alcança" em "quem alcança cada tipo", sem reavaliar regra.
export const lacunasDaMatriz = (
  tiposAto: TipoAto[],
  conferentes: Conferente[],
  alcance: AlcanceDoConferente[],
): string | null => {
  const permitidosPorConferente = new Map(alcance.map((a) => [a.conferenteId, new Set(a.tiposPermitidosIds)]))
  const quantosAlcancam = (tipo: TipoAto) =>
    conferentes.filter((c) => permitidosPorConferente.get(c.id)?.has(tipo.id)).length

  const ativos = tiposAto.filter((t) => t.ativo)
  const vazios = ativos.filter((t) => quantosAlcancam(t) === 0)
  const unicos = ativos.filter((t) => quantosAlcancam(t) === 1)
  if (vazios.length === 0 && unicos.length === 0) return null

  const partes: string[] = []
  if (vazios.length > 0) {
    const nomes = vazios.slice(0, NOMES_VISIVEIS).map((t) => t.nome)
    const reticencias = vazios.length > NOMES_VISIVEIS ? '…' : ''
    partes.push(
      `${vazios.length} ${vazios.length === 1 ? 'tipo' : 'tipos'} sem ninguém: ${nomes.join(', ')}${reticencias}.`,
    )
  }
  if (unicos.length > 0) partes.push(`${unicos.length} com uma só pessoa.`)
  return partes.join(' ')
}
