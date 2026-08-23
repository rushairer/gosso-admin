import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useParams } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, PageLoader } from './components/ui';
import { routerBasename } from './config/appPaths';

const Home = lazy(() => import('./pages/Home'));
const Callback = lazy(() => import('./pages/Callback'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Admin = lazy(() => import('./pages/Admin'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function LegacyAccountSettingsRedirect() {
  const { tab } = useParams();
  return <Navigate replace to={`/account-settings/${tab || 'profile'}`} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
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
                    <Home />
                  </AdminLayout>
                }
              />
              <Route path="/account-settings" element={<Navigate replace to="/account-settings/profile" />} />
              <Route
                path="/account-settings/:tab"
                element={
                  <AdminLayout>
                    <AccountSettings />
                  </AdminLayout>
                }
              />
              <Route path="/settings" element={<LegacyAccountSettingsRedirect />} />
              <Route path="/settings/:tab" element={<LegacyAccountSettingsRedirect />} />
              <Route path="/admin" element={<Navigate replace to="/admin/clients" />} />
              <Route
                path="/admin/:tab"
                element={
                  <AdminLayout>
                    <Admin />
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
      </ToastProvider>
    </ErrorBoundary>
  );
}
