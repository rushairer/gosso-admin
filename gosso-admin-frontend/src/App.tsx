import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MessageProvider, Skeleton } from '@gouno/ui/core';
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
      className="min-h-screen bg-background p-6 sm:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading application"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite" aria-label="Loading page">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="flex gap-3 overflow-hidden border-b pb-3">
        <Skeleton className="h-8 w-28 shrink-0" />
        <Skeleton className="h-8 w-28 shrink-0" />
        <Skeleton className="h-8 w-28 shrink-0" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-44 w-full rounded-lg" />
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
                  path="/system-management/:tab"
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
