import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, hasPermission } from './api';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import PartnerDetail from './pages/PartnerDetail';
import Roles from './pages/Roles';
import BackofficeUsers from './pages/BackofficeUsers';
import Support from './pages/Support';
import { ShieldOff } from 'lucide-react';

function ProtectedLayout() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <Outlet />
    </div>
  );
}

function ForbiddenPage() {
  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <ShieldOff size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
      <h1 className="page-title">403 — Access Denied</h1>
      <p className="page-subtitle">You don't have permission to view this page.</p>
    </div>
  );
}

function RequirePermission({ permission, children }) {
  if (!hasPermission(permission)) return <ForbiddenPage />;
  return children;
}

function PlaceholderPage({ title }) {
  return (
    <div className="main-content">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">Coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/portal">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:id" element={<PartnerDetail />} />
          <Route path="/cars" element={<PlaceholderPage title="Cars" />} />
          <Route path="/bookings" element={<PlaceholderPage title="Bookings" />} />
          <Route path="/reviews" element={<PlaceholderPage title="Reviews" />} />
          <Route path="/support" element={<Support />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="/roles" element={<RequirePermission permission="roles.view"><Roles /></RequirePermission>} />
          <Route path="/backoffice-users" element={<RequirePermission permission="users.view"><BackofficeUsers /></RequirePermission>} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
