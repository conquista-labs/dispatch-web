import type { InfoProtocolo, Prioridade, ProtocoloResumo } from '../model/types'

// RF-18e/RF-24f: os 4 eixos do requisito. "Prazo" é, ao pé da letra, um único alternador — "só
// urgentes e vencendo em 4h" (prioridade Alta OU vence em menos de 4h) — confirmado direto no
// protótipo (Dispatch.dc.html, `passaFiltro`/`f.urgentes`). Uma leitura anterior deste arquivo
// interpretava "prazo" como as 4 faixas do semáforo; corrigido depois de ler a lógica-fonte de
// verdade, não só o texto do requisito. `texto` (busca livre) e `data` (dia do vencimento) são
// novos nessa mesma leitura — não entram na contagem de "filtros ativos" do badge (o protótipo
// também não conta: ver `contaGestao`/`contaFila`, que somam só os 4 eixos combináveis).
export type FiltroProtocolo = {
  equipeIds: (string | null)[]
  tipoAtoIds: string[]
  prioridades: Prioridade[]
  urgente: boolean
  texto: string
  /** "yyyy-mm-dd", dia local do vencimento — null = sem filtro de data. */
  data: string | null
}

export const filtroVazio = (): FiltroProtocolo => ({ equipeIds: [], tipoAtoIds: [], prioridades: [], urgente: false, texto: '', data: null })

export const contagemFiltrosAtivos = (filtro: FiltroProtocolo): number =>
  Number(filtro.equipeIds.length > 0) + Number(filtro.tipoAtoIds.length > 0) + Number(filtro.prioridades.length > 0) + Number(filtro.urgente)

const LIMIAR_URGENTE_MS = 4 * 60 * 60 * 1000

// Mesma extração de "dia" do protótipo (`diaDe`) — ano/mês/dia no fuso local do navegador, não
// UTC, senão um vencimento às 21h vira "amanhã" pra quem está em UTC-3.
export const chaveDoDiaLocal = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "Os filtros... não alteram dado nenhum — só o recorte exibido" (RF-18e): é só um predicado
// sobre o que a tela já buscou inteiro, sem chamada nova nenhuma. `now` só é usado pelo eixo
// "urgente" (vence em menos de 4h a partir de agora).
export const protocoloPassaNoFiltro = (protocolo: ProtocoloResumo, info: InfoProtocolo, filtro: FiltroProtocolo, now: number): boolean => {
  if (filtro.equipeIds.length > 0 && !filtro.equipeIds.includes(info.equipeId)) return false
  if (filtro.tipoAtoIds.length > 0 && (!protocolo.tipoAtoId || !filtro.tipoAtoIds.includes(protocolo.tipoAtoId))) return false
  if (filtro.prioridades.length > 0 && !filtro.prioridades.includes(protocolo.prioridade)) return false
  if (filtro.urgente) {
    const venceLogo = protocolo.vencimentoEm != null && new Date(protocolo.vencimentoEm).getTime() - now < LIMIAR_URGENTE_MS
    if (!(protocolo.prioridade === 'Alta' || venceLogo)) return false
  }
  if (filtro.data && (!protocolo.vencimentoEm || chaveDoDiaLocal(protocolo.vencimentoEm) !== filtro.data)) return false
  if (filtro.texto.trim()) {
    const q = filtro.texto.trim().toLowerCase()
    const alvo = [protocolo.numero, info.tipoAtoNome, info.escreventeNome, info.equipeNome, protocolo.observacao]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!alvo.includes(q)) return false
  }
  return true
}
