import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, PageLoader } from '@gouno/ui';
import { SudoProvider } from './components/auth/SudoContext';
import { routerBasename } from './config/appPaths';
import { GossoProvider, RequireAdmin, RequireAuth } from '@gosso/client/react';
import { gossoClient } from './auth';
import { appPath } from './config/appPaths';

const Home = lazy(() => import('./pages/Home'));
const Callback = lazy(() => import('./pages/Callback'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AccountRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <RequireAuth redirectTo={appPath(location.pathname)} fallback={<PageLoader />}>
      {children}
    </RequireAuth>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <RequireAdmin
      redirectTo={appPath(location.pathname)}
      fallback={<PageLoader />}
      unauthorized={<Navigate replace to="/" />}
    >
      {children}
    </RequireAdmin>
  );
}

export default function App() {
  return (
    <GossoProvider client={gossoClient} initializeSession fallback={<PageLoader />}>
      <ErrorBoundary>
        <ToastProvider>
          <SudoProvider>
            <BrowserRouter basename={routerBasename}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* OIDC flow callbacks and triggers */}
                  <Route path="/callback" element={<Callback />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Regular layouts */}
                  <Route
                    path="/"
                    element={
                      <AdminLayout>
                        <AccountRoute>
                          <Home />
                        </AccountRoute>
                      </AdminLayout>
                    }
                  />
                  <Route path="/account-settings" element={<Navigate replace to="/account-settings/profile" />} />
                  <Route
                    path="/account-settings/:tab"
                    element={
                      <AdminLayout>
                        <AccountRoute>
                          <AccountSettings />
                        </AccountRoute>
                      </AdminLayout>
                    }
                  />
                  <Route path="/system-management" element={<Navigate replace to="/system-management/clients" />} />
                  <Route
                    path="/system-management/:tab"
                    element={
                      <AdminLayout>
                        <AdminRoute>
                          <SystemManagement />
                        </AdminRoute>
                      </AdminLayout>
                    }
                  />

                  {/* 404 catch-all */}
                  <Route
                    path="*"
                    element={
                      <AdminLayout>
                        <NotFound />
                      </AdminLayout>
                    }
                  />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SudoProvider>
        </ToastProvider>
      </ErrorBoundary>
    </GossoProvider>
  );
}
