// Ponto único de leitura das env vars — o resto do app importa daqui, nunca de
// import.meta.env direto, pra não espalhar a forma de configuração pelo código.
export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
}
