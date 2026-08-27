import axios from 'axios'

import { env } from '@/shared/config/env'

// `shared` é a camada mais de baixo do FSD — não pode importar de `entities` (onde mora a
// sessão) nem de `app` (onde mora a navegação). Por isso o cliente HTTP expõe pontos de
// extensão em vez de conhecer Zustand/React Router direto: quem sabe pegar o token (a sessão,
// em `entities/usuario`) e quem sabe navegar (o router, em `app`) se registram aqui na
// inicialização. Mesma ideia do AuthorizeHttpClientDecorator/AuthProvider que a gente viu no
// financas-front, só que como duas funções em vez de uma interface + adapter — não precisa de
// mais cerimônia do que isso pra um axios só.
let getToken: () => string | null = () => null
let onUnauthorized: () => void = () => {}

export const configureHttpClient = (config: { getToken: () => string | null; onUnauthorized: () => void }) => {
  getToken = config.getToken
  onUnauthorized = config.onUnauthorized
}

export const httpClient = axios.create({
  baseURL: env.apiUrl,
})

httpClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)
