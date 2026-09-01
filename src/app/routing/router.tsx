import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { LoginPage } from '@/pages/login'
import { ROUTES } from '@/shared/config/routes'
import { AppShell } from '@/widgets/app-shell'

import { RequireRole } from './require-role'
import { SessionBoot } from './session-boot'

// Lazy por página — cada uma vira um chunk próprio, baixado só quando a rota é visitada.
// `LoginPage` fica de fora de propósito: é a primeira tela que qualquer sessão não autenticada
// vê, então carregar ela já faz parte do boot inicial mesmo, não tem o que adiar.
const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })))
const DistribuicaoPage = lazy(() => import('@/pages/distribuicao').then((m) => ({ default: m.DistribuicaoPage })))
const ImportarPage = lazy(() => import('@/pages/importar').then((m) => ({ default: m.ImportarPage })))
const ConferentesPage = lazy(() => import('@/pages/conferentes').then((m) => ({ default: m.ConferentesPage })))
const MinhaFilaPage = lazy(() => import('@/pages/minha-fila').then((m) => ({ default: m.MinhaFilaPage })))
const FilaConferentesPage = lazy(() => import('@/pages/fila-conferentes').then((m) => ({ default: m.FilaConferentesPage })))
const CentralDeRegrasPage = lazy(() => import('@/pages/central-de-regras').then((m) => ({ default: m.CentralDeRegrasPage })))
const RegistrarTotpPage = lazy(() => import('@/pages/registrar-totp').then((m) => ({ default: m.RegistrarTotpPage })))
const RecuperarSenhaPage = lazy(() => import('@/pages/recuperar-senha').then((m) => ({ default: m.RecuperarSenhaPage })))

// Mesmo texto/classe já usado em todo canto do app enquanto uma query carrega (ver
// MinhaFilaBoard, DistribuicaoBoard etc.) — consistente com o resto, não é um spinner novo.
const CarregandoPagina = () => (
  <div className="px-7 pt-6 pb-7">
    <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  </div>
)

export const Router = () => (
  <BrowserRouter>
    <SessionBoot>
      <Suspense fallback={<CarregandoPagina />}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginPage />} />
          {/* RF-01a-l: públicas, como /login — sem RequireRole, fora do AppShell. */}
          <Route path={ROUTES.registrarTotp} element={<RegistrarTotpPage />} />
          <Route path={ROUTES.recuperarSenha} element={<RecuperarSenhaPage />} />

          <Route element={<AppShell />}>
            <Route
              path={ROUTES.distribuicao}
              element={
                <RequireRole roles={['Distribuidora']}>
                  <DistribuicaoPage />
                </RequireRole>
              }
            />
            <Route
              path={ROUTES.importar}
              element={
                <RequireRole roles={['Distribuidora']}>
                  <ImportarPage />
                </RequireRole>
              }
            />
            <Route
              path={ROUTES.conferentes}
              element={
                <RequireRole roles={['Distribuidora']}>
                  <ConferentesPage />
                </RequireRole>
              }
            />
            <Route
              path={ROUTES.minhaFila}
              element={
                <RequireRole roles={['Conferente']}>
                  <MinhaFilaPage />
                </RequireRole>
              }
            />
            <Route
              path={ROUTES.filaConferentes}
              element={
                <RequireRole roles={['Distribuidora']}>
                  <FilaConferentesPage />
                </RequireRole>
              }
            />
            <Route
              path={ROUTES.centralDeRegras}
              element={
                <RequireRole roles={['Distribuidora']}>
                  <CentralDeRegrasPage />
                </RequireRole>
              }
            />
            <Route
              path={ROUTES.dashboard}
              element={
                <RequireRole roles={['Distribuidora', 'Conferente']}>
                  <DashboardPage />
                </RequireRole>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </Suspense>
    </SessionBoot>
  </BrowserRouter>
)
