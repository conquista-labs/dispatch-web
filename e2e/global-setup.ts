// Garante o "chão" de login que quase todo spec precisa (distribuidora@cartorio.com,
// conferente-rf27@cartorio.com, conferente-visual@cartorio.com — sempre "Senha123!") antes da
// suíte rodar, chamando o endpoint dev-only POST /dev/seed-e2e (ver dispatch-api/CLAUDE.md).
// Sem isso, a suíte inteira dependia de o banco local já ter essas contas por acaso — quebrou
// de verdade quando o banco local virou um clone de produção pra uma análise pontual, e as
// contas seed simplesmente não existiam mais nele.
//
// Isso resolve só a IDENTIDADE de login. O dado de cada teste (protocolo, conferente extra,
// equipe...) continua responsabilidade de cada spec criar e apagar sozinho via API — isso aqui
// não muda (é a convenção que já valia pra a maioria dos specs, só o login que ficava de fora).
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:5245'

export default async function globalSetup() {
  const resposta = await fetch(`${API_URL}/dev/seed-e2e`, { method: 'POST' }).catch(() => null)

  if (!resposta) {
    throw new Error(
      `Não consegui alcançar a API em ${API_URL} pra semear as contas de teste (POST /dev/seed-e2e). ` +
        'Suba a API local antes de rodar a suíte: dotnet run --project src/Dispatch.Api (em ../dispatch-api).',
    )
  }

  if (!resposta.ok) {
    throw new Error(
      `POST /dev/seed-e2e devolveu ${resposta.status}. A API precisa estar rodando em ASPNETCORE_ENVIRONMENT=Development ` +
        '— esse endpoint só existe nesse ambiente, de propósito (nunca em produção).',
    )
  }
}
