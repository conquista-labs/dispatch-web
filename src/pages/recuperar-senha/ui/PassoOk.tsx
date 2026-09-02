const FEITOS = [
  'Senha nova em uso a partir de agora.',
  'Todas as sessões abertas foram encerradas.',
  'Atos que estavam em conferência com você voltaram ao pool.',
  'A distribuidora recebeu o registro na trilha de auditoria.',
]

// Etapa final (RF-01k) — extraído de RecuperarSenhaPage.tsx. Sem props: os 4 itens são sempre
// os mesmos, refletem o que RedefinirSenha (back) garante ter feito de verdade, não um resumo
// do que a página fez sozinha.
export const PassoOk = () => (
  <div className="mt-[18px] flex flex-col gap-2">
    {FEITOS.map((label) => (
      <span key={label} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-text-3">
        <span className="mt-px flex size-[15px] flex-none items-center justify-center rounded-full border border-ok-border bg-ok-bg text-ok-fg">✓</span>
        <span>{label}</span>
      </span>
    ))}
  </div>
)
