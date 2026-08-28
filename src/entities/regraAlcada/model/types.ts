import type { Nivel } from '@/entities/conferente'
import type { Etapa } from '@/entities/protocolo'

export type PermissaoRegra = 'Permite' | 'Nega'
export type OrigemRegra = 'Manual' | 'Aprendida'

// Espelha RegraAlcadaResponse (Dispatch.Api/Endpoints/RegraAlcadaEndpoints.cs) — sujeito é XOR
// nível/pessoa, alvo é XOR etapa/tipo de ato (RF-31), nunca os dois nem nenhum, mesma regra
// fechada do SujeitoAlcada/AlvoAlcada do back.
export type RegraAlcada = {
  id: string
  sujeitoNivel: Nivel | null
  sujeitoConferenteId: string | null
  permissao: PermissaoRegra
  alvoEtapa: Etapa | null
  alvoTipoAtoId: string | null
  origem: OrigemRegra
  ativa: boolean
}

export type CriarRegraAlcadaRequest = {
  sujeitoNivel?: Nivel
  sujeitoConferenteId?: string
  permissao: PermissaoRegra
  alvoEtapa?: Etapa
  alvoTipoAtoId?: string
}
