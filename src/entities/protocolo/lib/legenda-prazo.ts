// Faixas do semáforo (RF-14) como o back devolve: minutos antes do vencimento em que o ato passa a
// "atenção" e a "crítico". Vêm da Configuração (dispatch-api `FaixaAtencao`/`FaixaUrgente`) — o
// conferente recebe junto da própria fila, porque `GET /config` é só da gestão.
export type FaixasSemaforo = { atencaoMinutos: number; urgenteMinutos: number }

// Hora cheia vira "4h"; o resto fica em minutos ("90min", não um "2h" arredondado que mentiria
// sobre o limite).
export const formatarFaixa = (minutos: number): string =>
  minutos >= 60 && minutos % 60 === 0 ? `${minutos / 60}h` : `${minutos}min`

// Rótulos da legenda "Prazo do ato", na ordem das cores (ok, atenção, crítico, estourado) — texto
// do protótipo v2 (`faixas()`). Sem as faixas (API anterior, config ainda carregando), cai nos
// nomes genéricos em vez de inventar número.
export const rotulosDaLegenda = (faixas?: FaixasSemaforo | null): [string, string, string, string] =>
  faixas
    ? [
        'no prazo',
        `faltam menos de ${formatarFaixa(faixas.atencaoMinutos)}`,
        `faltam menos de ${formatarFaixa(faixas.urgenteMinutos)}`,
        'prazo estourado',
      ]
    : ['no prazo', 'atenção', 'crítico', 'prazo estourado']
