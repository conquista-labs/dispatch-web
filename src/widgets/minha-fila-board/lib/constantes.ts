// Mesmo limite da coluna "Pool aberto" de Distribuição (ver ProtocoloColuna.tsx, variant
// "conferente") — truncar em 3 e abrir a lista completa num Sheet quando tiver mais. Estava
// duplicado em MinhaFilaBoard.tsx e FilaDoConferenteBoard.tsx (cada um com comentário apontando
// pro outro) — achado numa auditoria de qualidade.
export const MAX_POOL_VISIVEL = 5

// RF-24g — no mobile a coluna do pool vira uma aba de tela cheia (mais espaço vertical que uma
// coluna de 1/3 no desktop), então mostra mais itens antes de truncar. Valor literal do
// requisito (8), não uma proporção do MAX_POOL_VISIVEL de desktop.
export const MAX_POOL_VISIVEL_MOBILE = 8
