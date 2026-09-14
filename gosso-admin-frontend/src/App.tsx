import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MessageProvider, Spinner } from '@gouno/ui/core';
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

function AppBootstrapLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading application"
    >
      <Spinner className="size-6 text-primary" />
    </div>
  );
}

function PageLoader() {
  return (
    <div
      className="flex min-h-64 items-center justify-center py-10"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Spinner className="size-5 text-primary" />
    </div>
  );
}

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
    <GossoProvider client={gossoClient} initializeSession fallback={<AppBootstrapLoader />}>
      <ErrorBoundary>
        <MessageProvider>
          <SudoProvider>
            <BrowserRouter basename={routerBasename}>
              <Routes>
                <Route
                  path="/callback"
                  element={
                    <Suspense fallback={<AppBootstrapLoader />}>
                      <Callback />
                    </Suspense>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<AppBootstrapLoader />}>
                      <Login />
                    </Suspense>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <Suspense fallback={<AppBootstrapLoader />}>
                      <ForgotPassword />
                    </Suspense>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <Suspense fallback={<AppBootstrapLoader />}>
                      <ResetPassword />
                    </Suspense>
                  }
                />

                <Route
                  path="/"
                  element={
                    <AdminLayout>
                      <AccountRoute>
                        <Suspense fallback={<PageLoader />}>
                          <Home />
                        </Suspense>
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
                        <Suspense fallback={<PageLoader />}>
                          <AccountSettings />
                        </Suspense>
                      </AccountRoute>
                    </AdminLayout>
                  }
                />
                <Route path="/system-management" element={<Navigate replace to="/system-management/clients" />} />
                <Route
                  path="/system-management/:section"
                  element={
                    <AdminLayout>
                      <AdminRoute>
                        <Suspense fallback={<PageLoader />}>
                          <SystemManagement />
                        </Suspense>
                      </AdminRoute>
                    </AdminLayout>
                  }
                />

                <Route
                  path="*"
                  element={
                    <AdminLayout>
                      <Suspense fallback={<PageLoader />}>
                        <NotFound />
                      </Suspense>
                    </AdminLayout>
                  }
                />
              </Routes>
            </BrowserRouter>
          </SudoProvider>
        </MessageProvider>
      </ErrorBoundary>
    </GossoProvider>
  );
}
