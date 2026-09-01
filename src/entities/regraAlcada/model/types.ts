import type { Nivel } from '@/entities/conferente'
import type { Etapa } from '@/entities/protocolo'

export type PermissaoRegra = 'Permite' | 'Nega'
export type OrigemRegra = 'Manual' | 'Aprendida'

// Espelha RegraAlcadaResponse (Dispatch.Api/Endpoints/RegraAlcadaEndpoints.cs) — sujeito é XOR
// nível/pessoa; alvo é um entre quatro (etapa / tipo de ato / equipe de escrevente / todos os
// atos — alçada plena, RF-29b), mesma regra fechada do SujeitoAlcada/AlvoAlcada do back.
// `alvoEhEquipe` existe porque "equipe" aceita `alvoEquipeId: null` como valor válido ("sem
// equipe", RF-29a) — sem o flag não daria pra diferenciar "regra de equipe = sem equipe" de
// "não é regra de equipe" só olhando pra `alvoEquipeId`.
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
}
