import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
              <Route
                path="/settings"
                element={
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin"
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
