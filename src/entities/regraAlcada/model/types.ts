import type { Nivel } from '@/entities/conferente'
import type { Etapa, Prioridade } from '@/entities/protocolo'
import type { GrupoTipoAto } from '@/entities/tipoAto'

// Motor v3: Reserva é um 3º tipo de permissão — reserva um alvo pra um sujeito só, todo mundo
// mais fica bloqueado nele mesmo que tivesse Permite por outra regra (ver CLAUDE.md do back,
// "Motor de alçada v3").
export type PermissaoRegra = 'Permite' | 'Nega' | 'Reserva'
export type OrigemRegra = 'Manual' | 'Aprendida'

// Espelha RegraAlcadaResponse (Dispatch.Api/Endpoints/RegraAlcadaEndpoints.cs) — sujeito é XOR
// nível/pessoa; alvo é um entre cinco (etapa / tipo de ato / equipe de escrevente / todos os
// atos — alçada plena, RF-29b / grupo de tipo de ato — Motor v3), mesma regra fechada do
// SujeitoAlcada/AlvoAlcada do back. `alvoEhEquipe` existe porque "equipe" aceita
// `alvoEquipeId: null` como valor válido ("sem equipe", RF-29a) — sem o flag não daria pra
// diferenciar "regra de equipe = sem equipe" de "não é regra de equipe" só olhando pra
// `alvoEquipeId`.
export type RegraAlcada = {
  id: string
  sujeitoNivel: Nivel | null
  sujeitoConferenteId: string | null
  permissao: PermissaoRegra
  alvoEtapa: Etapa | null
  alvoTipoAtoId: string | null
  alvoEhEquipe: boolean
  alvoEquipeId: string | null
  alvoTodosOsAtos: boolean
  alvoGrupo: GrupoTipoAto | null
  origem: OrigemRegra
  ativa: boolean
  usos: number
}

export type CriarRegraAlcadaRequest = {
  sujeitoNivel?: Nivel
  sujeitoConferenteId?: string
  permissao: PermissaoRegra
  alvoEtapa?: Etapa
  alvoTipoAtoId?: string
  alvoEhEquipe?: boolean
  alvoEquipeId?: string | null
  alvoTodosOsAtos?: boolean
  alvoGrupo?: GrupoTipoAto
}

// Motor v3 — qual dimensão motivou um bloqueio (DecisaoAlcada.Motivo no back). Só pista de UX,
// não faz parte da decisão em si — o nome próprio que completa a frase ("Testamento fora da
// alçada") mora no front, que já tem o lookup pronto (mesmo padrão de fraseDaRegra).
export type MotivoAlcada = 'Etapa' | 'Tipo' | 'Grupo' | 'Equipe' | 'Geral' | 'Reservado'

export type PassoTrilha = {
  camada: string
  efeito: 'Permitido' | 'Negado'
  regraId: string | null
}

// Espelha AlcadaConferenteResponse — usado tanto no painel de detalhe do protocolo quanto no
// simulador "Testar".
export type AvaliacaoAlcada = {
  conferenteId: string
  elegivel: boolean
  regraId: string | null
  motivo: MotivoAlcada | null
  trilha: PassoTrilha[]
}

export type TestarAlcadaRequest = {
  etapa: Etapa
  tipoAtoId: string
  equipeId?: string | null
  prioridade: Prioridade
}

// Destino real do motor de distribuição (RF-34) — antes desta correção, o front inferia isso
// só pela contagem de elegíveis, o que dava errado sempre que a urgência importasse (ver
// dispatch-api/CLAUDE.md e dispatch-web/CLAUDE.md, "Backlog de qualidade de código").
export type TestarAlcadaResponse = {
  avaliacoes: AvaliacaoAlcada[]
  destino: 'Atribuido' | 'EnviadoParaPool' | 'Excecao'
  conferenteId: string | null
  motivo: string | null
}
