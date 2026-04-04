import { useEffect, useState } from 'react';
import {
  fetchBackofficeUsers, fetchBackofficeUser, createBackofficeUser,
  updateBackofficeUser, resetBackofficeUserPassword, fetchRoles,
} from '../api';
import { usePermission } from '../components/PermissionGate';
import { Users, Plus, Edit2, KeyRound, X, Copy, Check, Eye, EyeOff } from 'lucide-react';

const EMPTY_FORM = { fullName: '', email: '', roleId: '', isActive: true };

export default function BackofficeUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Credentials modal
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const canCreate = usePermission('users.create');
  const canEdit = usePermission('users.edit');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [u, r] = await Promise.all([fetchBackofficeUsers(), fetchRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, roleId: roles[0]?.id || '' });
    setModalOpen(true);
  }

  async function openEdit(user) {
    try {
      const detail = await fetchBackofficeUser(user.id);
      setEditing(detail);
      setForm({
        fullName: detail.fullName,
        email: detail.email,
        roleId: detail.roleId,
        isActive: detail.isActive,
      });
      setModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function closeCredsModal() {
    if (!confirmed) return;
    setCreds(null);
    setCopied(false);
    setShowPwd(false);
    setConfirmed(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateBackofficeUser(editing.id, form);
        await load();
        closeModal();
      } else {
        const result = await createBackofficeUser({
          fullName: form.fullName,
          email: form.email,
          roleId: form.roleId,
        });
        await load();
        closeModal();
        // Show credentials
        setCreds({ email: result.email, password: result.generatedPassword });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(userId) {
    try {
      const result = await resetBackofficeUserPassword(userId);
      setCreds({ email: result.email, password: result.generatedPassword });
    } catch (err) {
      setError(err.message);
    }
  }

  function copyCredentials() {
    if (!creds) return;
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const getInitials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';

  const COLORS = ['blue', 'purple', 'green', 'amber', 'red'];

  if (error && !modalOpen && !creds) {
    return (
      <div className="main-content">
        <p style={{ color: 'var(--red)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backoffice Users</h1>
          <p className="page-subtitle">{users.length} users</p>
        </div>
        {canCreate && (
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={openCreate}>
            <Plus size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            Add User
          </button>
        )}
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>USER</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>LAST LOGIN</th>
              <th style={{ width: 100 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={`user-avatar ${COLORS[i % COLORS.length]}`}>
                      {getInitials(user.full_name)}
                    </div>
                    <span className="name">{user.full_name}</span>
                  </div>
                </td>
                <td className="muted">{user.email}</td>
                <td>
                  <span className="pill blue">{user.role_name || '—'}</span>
                </td>
                <td>
                  <span className={`pill ${user.is_active ? 'green' : 'red'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="muted">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : 'Never'}
                </td>
                <td>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(user)}>
                        <Edit2 size={15} />
                      </button>
                      <button className="icon-btn" title="Reset Password" onClick={() => handleResetPassword(user.id)}>
                        <KeyRound size={15} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Credentials modal */}
      {creds && (
        <div className="modal-overlay">
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Credentials</h3>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', fontSize: 13, padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                Save these credentials now. The password cannot be retrieved later.
              </div>
              <div className="creds-box">
                <div className="creds-row">
                  <span className="creds-label">Email</span>
                  <span className="creds-value">{creds.email}</span>
                </div>
                <div className="creds-row">
                  <span className="creds-label">Password</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="creds-value" style={{ fontFamily: 'monospace' }}>
                      {showPwd ? creds.password : '••••••••••••'}
                    </span>
                    <button className="icon-btn" onClick={() => setShowPwd(!showPwd)} title={showPwd ? 'Hide' : 'Show'}>
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={copyCredentials}>
                {copied ? <><Check size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Copied!</> : <><Copy size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Copy Credentials</>}
              </button>
              <label className="creds-confirm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                />
                <span>I have copied and saved the credentials</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={closeCredsModal} disabled={!confirmed}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit User' : 'Add User'}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    value={form.fullName}
                    onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@yallarent.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={form.roleId}
                    onChange={e => setForm(prev => ({ ...prev, roleId: e.target.value }))}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                {editing && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={form.isActive ? 'true' : 'false'}
                      onChange={e => setForm(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
                {!editing && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    A secure password will be auto-generated and shown after creation.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} disabled={saving}>
                  {saving ? 'Saving...' : (editing ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
