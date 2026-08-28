import type { OrigemRegra, PermissaoRegra } from '../model/types'

export const PERMISSAO_LABEL: Record<PermissaoRegra, string> = { Permite: 'pode', Nega: 'não pode' }

export const ORIGEM_LABEL: Record<OrigemRegra, string> = { Manual: 'você', Aprendida: 'aprendida' }
