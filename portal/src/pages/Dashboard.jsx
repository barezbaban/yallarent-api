import { useEffect, useState } from 'react';
import { fetchDashboard } from '../api';
import {
  Users, CalendarCheck, Banknote, Car,
  TrendingUp, ArrowRight,
} from 'lucide-react';

const AVATAR_COLORS = ['blue', 'purple', 'green', 'amber', 'red'];

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return String(n);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusPill(status) {
  const map = {
    confirmed: { label: 'Active', cls: 'green' },
    completed: { label: 'Completed', cls: 'blue' },
    pending: { label: 'Pending', cls: 'amber' },
    cancelled: { label: 'Cancelled', cls: 'red' },
  };
  const s = map[status] || { label: status, cls: 'amber' };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeSince(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="main-content"><p style={{ color: 'var(--red)' }}>{error}</p></div>;
  if (!data) return <div className="main-content"><p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p></div>;

  const { stats, recentBookings, recentUsers } = data;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="page-date">
          <CalendarCheck size={15} />
          {today}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Users</span>
            <div className="stat-icon blue"><Users size={18} /></div>
          </div>
          <div className="stat-value">{formatNumber(stats.totalUsers)}</div>
          <div className="stat-trend">
            <TrendingUp size={14} color="var(--green)" />
            <span className="pct">+12%</span>
            <span className="label">from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Bookings</span>
            <div className="stat-icon green"><CalendarCheck size={18} /></div>
          </div>
          <div className="stat-value">{stats.activeBookings}</div>
          <div className="stat-trend">
            <TrendingUp size={14} color="var(--green)" />
            <span className="pct">+8%</span>
            <span className="label">from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Revenue (IQD)</span>
            <div className="stat-icon amber"><Banknote size={18} /></div>
          </div>
          <div className="stat-value">{formatNumber(stats.totalRevenue)}</div>
          <div className="stat-trend">
            <TrendingUp size={14} color="var(--green)" />
            <span className="pct">+23%</span>
            <span className="label">from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Cars</span>
            <div className="stat-icon teal"><Car size={18} /></div>
          </div>
          <div className="stat-value">{stats.activeCars}</div>
          <div className="stat-trend">
            <TrendingUp size={14} color="var(--green)" />
            <span className="pct">+5%</span>
            <span className="label">from last month</span>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="table-card">
          <div className="table-card-header">
            <span className="table-card-title">Recent Bookings</span>
            <button className="view-all">View All <ArrowRight size={14} /></button>
          </div>
          <table>
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>CAR</th>
                <th>DATES</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 && (
                <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>No bookings yet</td></tr>
              )}
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td className="name">{b.renter_name}</td>
                  <td>{b.car_name}</td>
                  <td className="muted">{shortDate(b.start_date)}–{shortDate(b.end_date)}</td>
                  <td className="name">{formatNumber(b.total_price)} IQD</td>
                  <td>{statusPill(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="user-list-card">
          <div className="table-card-header">
            <span className="table-card-title">New Users</span>
            <button className="view-all">View All <ArrowRight size={14} /></button>
          </div>
          {recentUsers.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users yet</div>
          )}
          {recentUsers.map((u, i) => (
            <div className="user-list-item" key={u.id}>
              <div className={`user-avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                {getInitials(u.full_name)}
              </div>
              <div className="user-list-info">
                <div className="user-list-name">{u.full_name}</div>
                <div className="user-list-meta">{u.city || 'No city'} &middot; {timeSince(u.created_at)}</div>
              </div>
              <span className="pill green">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
