import type { Nivel } from '../model/types'

// Extraído de ConferenteCard/NovoConferenteDialog (duplicado nos dois) na terceira repetição —
// Central de regras (builder de alçada, matriz de alcance, aprendizado) também precisa disso.
export const NIVEL_LABEL: Record<Nivel, string> = { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' }

// "Analista Pleno" — ou nada, quando o nível veio oculto (quem vê não é Administrador). Quem chama
// decide o que fica no lugar; nunca um nível de mentirinha.
export const rotuloAnalista = (nivel: Nivel | null): string | null => (nivel ? `Analista ${NIVEL_LABEL[nivel]}` : null)
