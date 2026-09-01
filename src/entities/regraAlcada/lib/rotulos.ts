import type { MotivoAlcada, OrigemRegra, PermissaoRegra } from '../model/types'

export const PERMISSAO_LABEL: Record<PermissaoRegra, string> = { Permite: 'pode', Nega: 'não pode', Reserva: 'é o único que confere' }

export const ORIGEM_LABEL: Record<OrigemRegra, string> = { Manual: 'você', Aprendida: 'aprendida' }

// Sufixo de "fora da alçada" no simulador "Testar" — o nome próprio (tipo/equipe) que completa
// a frase é responsabilidade de quem chama, o motivo só diz qual dimensão foi a causa.
export const MOTIVO_ALCADA_LABEL: Record<MotivoAlcada, string> = {
  Etapa: 'etapa fora da alçada',
  Tipo: 'tipo fora da alçada',
  Grupo: 'grupo fora da alçada',
  Equipe: 'escrevente sem equipe habilitada fora da alçada',
  Geral: 'barrado por regra',
  Reservado: 'reservado a outra pessoa',
}
