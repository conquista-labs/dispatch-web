import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ConferentesPage } from '@/pages/conferentes'
import { DistribuicaoPage } from '@/pages/distribuicao'
import { FilaConferentesPage } from '@/pages/fila-conferentes'
import { ImportarPage } from '@/pages/importar'
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
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    </SessionBoot>
  </BrowserRouter>
)
