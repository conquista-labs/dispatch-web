export type RegraSenha = { label: string; ok: boolean }

// Mesmas 3 regras do back (Dispatch.Domain.RegrasDeSenha) — replicadas aqui só pra feedback ao
// vivo, o back segue sendo a fonte da verdade (ver dispatch-api/CLAUDE.md). Extraída pra função
// pura (não fica só dentro de PassoSenha.tsx) porque o shell da página também precisa saber se
// bateu tudo, pra habilitar o botão "Salvar nova senha", sem duplicar a regra em dois lugares.
export const avaliarRegrasSenha = (senha1: string, senha2: string): RegraSenha[] => [
  { label: 'Pelo menos 12 caracteres', ok: senha1.length >= 12 },
  { label: 'Não é uma senha óbvia', ok: senha1.length >= 12 && !/^(senha|123|cartorio|dispatch)/i.test(senha1) },
  { label: 'As duas iguais', ok: senha1.length > 0 && senha1 === senha2 },
]
