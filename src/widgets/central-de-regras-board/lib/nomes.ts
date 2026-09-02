import type { Conferente } from '@/entities/conferente'
import type { Equipe } from '@/entities/equipe'
import type { TipoAto } from '@/entities/tipoAto'

// Os mesmos 3 Maps id→nome (conferente/tipoAto/equipe) eram reconstruídos, idênticos, em
// AbaAlcada/AbaAlcadaTestar/AbaRegrasEmVigor — achado numa auditoria de qualidade. Fica aqui
// (não em nenhuma `entities/`) porque cruza 3 entidades diferentes e só é usado dentro deste
// widget.
export const criarNomesDaCentralDeRegras = (conferentes: Conferente[], tiposAto: TipoAto[], equipes: Equipe[]) => ({
  nomePorConferenteId: new Map(conferentes.map((c) => [c.id, c.nome])),
  nomePorTipoAtoId: new Map(tiposAto.map((t) => [t.id, t.nome])),
  nomePorEquipeId: new Map(equipes.map((e) => [e.id, e.nome])),
})
