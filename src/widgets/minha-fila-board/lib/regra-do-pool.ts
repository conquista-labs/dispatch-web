import type { RegraDoPool } from '@/entities/protocolo'

// Quem decide é o back (o "Pegar" fora da vez ou acima do limite volta 409); aqui só se esconde
// o botão que seria recusado. Sem a regra (API anterior), qualquer card do pool pode ser pego.
export const podePegarDoPool = (protocoloId: string, regra: RegraDoPool | undefined): boolean => {
  if (!regra) return true
  if (regra.naMao >= regra.limiteNaMao) return false
  return regra.ordemObrigatoria ? protocoloId === regra.proximoId : true
}

// Linha de orientação sob o título do pool — diz por que só um card tem botão, ou por que nenhum.
export const orientacaoDoPool = (regra: RegraDoPool | undefined, proximoVisivel: boolean): string | null => {
  if (!regra) return null
  const naMao = `${regra.naMao} de ${regra.limiteNaMao} na mão`
  if (regra.naMao >= regra.limiteNaMao) {
    return `Você está com ${naMao} — conclua um para pegar o próximo do pool.`
  }
  if (!regra.ordemObrigatoria) return `Você está com ${naMao}.`
  if (regra.proximoId && !proximoVisivel) {
    return `O próximo da vez está escondido pelos filtros — limpe-os para pegá-lo. ${naMao}.`
  }
  return `Pegue na ordem da fila: prioridade alta primeiro, depois quem vence antes. ${naMao}.`
}
