import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { DistribuicaoPage } from '@/pages/distribuicao'
import { LoginPage } from '@/pages/login'
import { MinhaFilaPage } from '@/pages/minha-fila'
import { ROUTES } from '@/shared/config/routes'
import { AppShell } from '@/widgets/app-shell'

import { RequireRole } from './require-role'
import { SessionBoot } from './session-boot'

export const Router = () => (
  <BrowserRouter>
    <SessionBoot>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />

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
            path={ROUTES.minhaFila}
            element={
              <RequireRole roles={['Conferente']}>
                <MinhaFilaPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    </SessionBoot>
  </BrowserRouter>
)
