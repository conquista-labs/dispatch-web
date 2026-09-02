// Mesmo limite da coluna "Pool aberto" de Distribuição (ver ProtocoloColuna.tsx, variant
// "conferente") — truncar em 3 e abrir a lista completa num Sheet quando tiver mais. Estava
// duplicado em MinhaFilaBoard.tsx e FilaDoConferenteBoard.tsx (cada um com comentário apontando
// pro outro) — achado numa auditoria de qualidade.
export const MAX_POOL_VISIVEL = 5
