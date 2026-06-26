import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import Home from './pages/Home';
import Callback from './pages/Callback';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* OIDC flow callbacks and triggers */}
        <Route path="/callback" element={<Callback />} />
        <Route path="/login" element={<Login />} />

        {/* Regular layouts */}
        <Route path="/" element={<AdminLayout><Home /></AdminLayout>} />
        <Route path="/settings" element={<AdminLayout><Settings /></AdminLayout>} />
        <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
