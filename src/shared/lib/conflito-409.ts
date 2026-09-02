import { isAxiosError } from 'axios'

// Detecção de conflito (409, ex.: e-mail já cadastrado) a partir do `error` de uma mutation do
// TanStack Query — mesma checagem duplicada em NovoConferenteDialog.tsx/EditarConferenteDialog.tsx
// (achado numa auditoria de qualidade). Só o `isAxiosError`+status é compartilhado; o resto de
// cada diálogo (campos do formulário, reset ao abrir) segue próprio de cada um — são formas
// diferentes demais pra valer a pena forçar num hook só. Não é hook (sem estado/efeito por
// dentro), por isso sem prefixo `use`.
export const ehConflito409 = (error: unknown): boolean => isAxiosError(error) && error.response?.status === 409
