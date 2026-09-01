import type { FaixaSemaforo, InfoProtocolo, Prioridade, ProtocoloResumo } from '../model/types'

// RF-18e/RF-24f: os 4 eixos do requisito, lidos como multisseleção independente — "prazo" é
// lido como as 4 faixas do semáforo (o exemplo do requisito, "só urgentes e vencendo em 4h", é
// uma combinação de prioridade=Alta + prazo=atenção-ou-pior, não um quinto eixo). Array vazio
// num eixo = sem restrição naquele eixo (mostra tudo). `null` em `equipeIds` é "sem equipe".
export type FiltroProtocolo = {
  equipeIds: (string | null)[]
  tipoAtoIds: string[]
  prioridades: Prioridade[]
  faixasSemaforo: FaixaSemaforo[]
}

export const filtroVazio = (): FiltroProtocolo => ({ equipeIds: [], tipoAtoIds: [], prioridades: [], faixasSemaforo: [] })

export const contagemFiltrosAtivos = (filtro: FiltroProtocolo): number =>
  Number(filtro.equipeIds.length > 0) +
  Number(filtro.tipoAtoIds.length > 0) +
  Number(filtro.prioridades.length > 0) +
  Number(filtro.faixasSemaforo.length > 0)

// "Os filtros... não alteram dado nenhum — só o recorte exibido" (RF-18e): é só um predicado
// sobre o que a tela já buscou inteiro, sem chamada nova nenhuma.
export const protocoloPassaNoFiltro = (protocolo: ProtocoloResumo, info: InfoProtocolo, filtro: FiltroProtocolo): boolean => {
  if (filtro.equipeIds.length > 0 && !filtro.equipeIds.includes(info.equipeId)) return false
  if (filtro.tipoAtoIds.length > 0 && (!protocolo.tipoAtoId || !filtro.tipoAtoIds.includes(protocolo.tipoAtoId))) return false
  if (filtro.prioridades.length > 0 && !filtro.prioridades.includes(protocolo.prioridade)) return false
  if (filtro.faixasSemaforo.length > 0 && (!protocolo.semaforo || !filtro.faixasSemaforo.includes(protocolo.semaforo))) return false
  return true
}
