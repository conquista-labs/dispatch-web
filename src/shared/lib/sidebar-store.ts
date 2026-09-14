import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SidebarState = {
  recolhida: boolean
  toggleRecolhida: () => void
}

// Estado de UI só do desktop (a sidebar nem existe abaixo do breakpoint mobile — RNF-13 já
// troca por uma barra superior) — persistido por navegador, mesmo padrão de useThemeStore.
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      recolhida: false,
      toggleRecolhida: () => set({ recolhida: !get().recolhida }),
    }),
    { name: 'dispatch-sidebar' },
  ),
)
