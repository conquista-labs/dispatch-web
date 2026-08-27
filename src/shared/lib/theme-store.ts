import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Tema = 'light' | 'dark'

type ThemeState = {
  tema: Tema
  toggleTema: () => void
}

const aplicarNoDocumento = (tema: Tema) => {
  document.documentElement.classList.toggle('dark', tema === 'dark')
}

// RF-04: alternador de tema, com persistência (aqui, por navegador — não existe preferência de
// tema no cadastro do usuário no back hoje). Aplica a classe `.dark` direto no <html> porque é
// isso que o `@custom-variant dark` do Tailwind (src/app/styles/index.css) espera.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      tema: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      toggleTema: () => {
        const novo = get().tema === 'dark' ? 'light' : 'dark'
        aplicarNoDocumento(novo)
        set({ tema: novo })
      },
    }),
    {
      name: 'dispatch-tema',
      onRehydrateStorage: () => (state) => {
        if (state) aplicarNoDocumento(state.tema)
      },
    },
  ),
)
