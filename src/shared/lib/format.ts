// Formatação de tempo — tradução direta das funções `dur`/`fmt`/`fmtMin` do protótipo aprovado
// (../dispatch-prototype/Dispatch.dc.html). Mantém os mesmos formatos de texto ("vence em
// 3h20", cronômetro "00:14:22", "21 min") pra não inventar um jeito novo de mostrar prazo.

// "Xmin" / "Xh20" / "Xd4h" — usado no chip de prazo (RF-14/RF-19).
export const formatDuracaoCurta = (ms: number): string => {
  const m = Math.round(ms / 60_000)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`
  const d = Math.floor(h / 24)
  return `${d}d${h % 24 ? `${h % 24}h` : ''}`
}

// "00:14:22" — cronômetro ao vivo do card "Em conferência" (RF-21).
export const formatCronometro = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// Duracao do back vem como TimeSpan do .NET, formato "[d.]hh:mm:ss[.fffffff]" — parseia só o
// que precisa pra virar "21 min" (RF-24, lista de concluídos hoje).
export const formatDuracaoConcluida = (duracaoTimeSpan: string): string => {
  const [, dias, horas, minutos] = duracaoTimeSpan.match(/^(?:(\d+)\.)?(\d+):(\d+):/) ?? []
  const totalMinutos = (Number(dias ?? 0) * 24 + Number(horas ?? 0)) * 60 + Number(minutos ?? 0)
  return `${totalMinutos} min`
}
