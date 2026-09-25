// Rótulo curto de cada coluna da matriz (w-11). O protótipo usa as 4 primeiras letras do primeiro
// nome ("Márc"), que colide com nomes reais parecidos ("Conferente Teste 1/2/3" viravam "Conf Conf
// Conf"). Híbrido: mantém o do protótipo quando é único na lista e, se colide, cai nas iniciais de
// cada palavra (números inteiros: "Conferente Teste 12" → "CT12"). O nome completo segue no `title`.
const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra) => (/^\d+$/.test(palavra) ? palavra : palavra[0].toUpperCase()))
    .join('')
    .slice(0, 5)

const quatroLetras = (nome: string) => nome.trim().split(/\s+/)[0].slice(0, 4)

export const abreviacoesDeColuna = (nomes: string[]): string[] => {
  const curtas = nomes.map(quatroLetras)
  return nomes.map((nome, i) => (curtas.filter((c) => c === curtas[i]).length > 1 ? iniciais(nome) : curtas[i]))
}
