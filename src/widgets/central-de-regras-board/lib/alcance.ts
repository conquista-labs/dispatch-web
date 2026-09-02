// A linha de grupo e a linha de tipo da matriz de alcance decidiam cor+glifo com dois
// ternários paralelos cada uma (um pra classe de cor, outro pro caractere) — mesma condição
// checada duas vezes, fácil um dos dois desalinhar do outro numa edição futura. Achado numa
// auditoria de qualidade. Cada linha continua com seu próprio espaço de estados (são conceitos
// diferentes: cobertura do grupo inteiro vs. origem da permissão num tipo) — só a forma de
// resolver estado→{glifo,cor} ficou compartilhada.
export type EstadoAlcance = { glifo: string; cor: string }

export type StatusGrupo = 'cheio' | 'parcial' | 'vazio'

export const ESTADO_GRUPO: Record<StatusGrupo, EstadoAlcance> = {
  cheio: { glifo: '●', cor: 'text-foreground' },
  parcial: { glifo: '◐', cor: 'text-warn-fg' },
  vazio: { glifo: '·', cor: 'text-muted-foreground' },
}

export type StatusTipo = 'bloqueado' | 'excecao' | 'herdado'

export const ESTADO_TIPO: Record<StatusTipo, EstadoAlcance> = {
  bloqueado: { glifo: '·', cor: 'text-muted-foreground' },
  excecao: { glifo: '◆', cor: 'text-warn-fg' },
  herdado: { glifo: '●', cor: 'text-foreground' },
}
