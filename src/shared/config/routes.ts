// Caminhos de rota num lugar só — páginas, o router e os redirects de papel (RF-03) importam
// daqui, nunca com a string escrita na mão em mais de um arquivo.
export const ROUTES = {
  login: '/login',
  distribuicao: '/distribuicao',
  importar: '/importar',
  conferentes: '/conferentes',
  minhaFila: '/minha-fila',
  // RF-19 — mesmo rótulo de menu "Minha fila" do protótipo aprovado pra Distribuidora, rota
  // separada porque o conteúdo/comportamento é bem diferente (escolhe conferente, somente
  // leitura) do que RequireRole(Conferente) já protege em ROUTES.minhaFila.
  filaConferentes: '/fila-conferentes',
  centralDeRegras: '/central-de-regras',
  dashboard: '/dashboard',
} as const
