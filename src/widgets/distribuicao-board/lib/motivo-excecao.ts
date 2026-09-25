export type ApresentacaoDaExcecao = {
  /** Tag curta ao lado do número (protótipo: `p.tag`). */
  tag: string
  /** Frase que explica o motivo e o que fazer (protótipo: `p.excecao`). */
  frase: string
  tipoNovo: boolean
}

// RF-17: o back manda o motivo como texto livre (MotorDistribuicao — "tipo desconhecido", "tipo
// desativado", "conferente da primeira conferência não está mais disponível", "ninguém com
// alçada"). O protótipo mostra uma tag curta e uma frase que diz o que fazer; aqui o texto é
// derivado do motivo. Motivo que o front não conhece aparece como veio, pra não esconder uma
// exceção nova do back atrás de um rótulo errado.
export const apresentacaoDaExcecao = (motivo: string | null): ApresentacaoDaExcecao => {
  switch (motivo) {
    case 'tipo desconhecido':
      return {
        tag: 'tipo novo',
        frase: 'Tipo de ato desconhecido — ninguém tem alçada definida para ele.',
        tipoNovo: true,
      }
    case 'tipo desativado':
      return {
        tag: 'tipo desativado',
        frase: 'Tipo de ato desativado no catálogo — atribua na mão ou peça para reativar ou mesclar o tipo.',
        tipoNovo: false,
      }
    case 'conferente da primeira conferência não está mais disponível':
      return {
        tag: 'continuidade',
        frase: 'Quem fez a primeira conferência deste ato não está disponível — atribua a outra pessoa.',
        tipoNovo: false,
      }
    case 'ninguém com alçada':
      return {
        tag: 'sem alçada',
        frase: 'Nenhum conferente disponível tem alçada para este ato — atribua na mão.',
        tipoNovo: false,
      }
    default:
      return { tag: 'exceção', frase: motivo ?? 'O motor não conseguiu decidir sozinho.', tipoNovo: false }
  }
}
