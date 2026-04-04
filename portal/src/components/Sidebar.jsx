import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getAdmin, hasPermission } from '../api';
import {
  LayoutDashboard, Users, Building2, Car, Calendar,
  Star, Headphones, Bell, Settings, LogOut, Shield,
} from 'lucide-react';

const NAV = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { path: '/partners', label: 'Partners', icon: Building2, permission: 'companies.view' },
  { path: '/cars', label: 'Cars', icon: Car, permission: 'cars.view' },
  { path: '/bookings', label: 'Bookings', icon: Calendar, permission: 'bookings.view' },
  { path: '/reviews', label: 'Reviews', icon: Star },
  { path: '/support', label: 'Support', icon: Headphones },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
  { path: '/roles', label: 'Roles', icon: Shield, permission: 'roles.view' },
  { path: '/backoffice-users', label: 'Users', icon: Users, permission: 'users.view' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = getAdmin();

  const initials = admin?.fullName
    ? admin.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AA';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Car size={24} />
        YallaRent
      </div>
      <div className="sidebar-label">MAIN MENU</div>
      <nav className="sidebar-nav">
        {NAV.filter(item => !item.permission || hasPermission(item.permission)).map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-divider" />
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div>
          <div className="sidebar-user-name">{admin?.fullName || 'Admin'}</div>
          <div className="sidebar-user-email">{admin?.email || ''}</div>
        </div>
      </div>
      <button className="nav-item" onClick={handleLogout} style={{ marginTop: 8 }}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
