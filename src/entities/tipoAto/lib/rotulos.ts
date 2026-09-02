import type { GrupoTipoAto } from '../model/types'

export const GRUPO_LABEL: Record<GrupoTipoAto, string> = {
  Transmissoes: 'Transmissões',
  Sucessoes: 'Sucessões',
  Familia: 'Família',
  Garantias: 'Garantias',
  Notariais: 'Notariais',
}

// Mesma técnica de TIPOS_PRAZO (EquipeCard.tsx/NovaEquipeDialog.tsx) — deriva do enum via
// Object.keys em vez de hardcoded, pra não dessincronizar se um grupo novo for adicionado.
// Extraído depois de uma auditoria de qualidade achar 3 cópias hardcoded desta mesma lista.
export const GRUPOS = Object.keys(GRUPO_LABEL) as GrupoTipoAto[]
