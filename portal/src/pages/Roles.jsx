import { useEffect, useState } from 'react';
import {
  fetchRoles, createRole, updateRole, deleteRole, fetchPermissionsList,
} from '../api';
import { usePermission } from '../components/PermissionGate';
import { Shield, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const EMPTY_FORM = { name: '', description: '', permissions: {} };

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissionsDef, setPermissionsDef] = useState({});
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canCreate = usePermission('roles.create');
  const canEdit = usePermission('roles.edit');
  const canDelete = usePermission('roles.delete');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [r, p] = await Promise.all([fetchRoles(), fetchPermissionsList()]);
      setRoles(r);
      setPermissionsDef(p);
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreate() {
    setEditing(null);
    // Initialize all permissions to false
    const perms = {};
    Object.values(permissionsDef).forEach(group => {
      Object.keys(group).forEach(key => { perms[key] = false; });
    });
    setForm({ name: '', description: '', permissions: perms });
    setModalOpen(true);
  }

  function openEdit(role) {
    setEditing(role);
    // Merge role permissions with full list (default false for missing)
    const perms = {};
    Object.values(permissionsDef).forEach(group => {
      Object.keys(group).forEach(key => {
        perms[key] = role.permissions?.[key] === true;
      });
    });
    setForm({ name: role.name, description: role.description || '', permissions: perms });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function togglePermission(key) {
    setForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  }

  function toggleCategory(category) {
    const keys = Object.keys(permissionsDef[category]);
    const allChecked = keys.every(k => form.permissions[k]);
    setForm(prev => {
      const perms = { ...prev.permissions };
      keys.forEach(k => { perms[k] = !allChecked; });
      return { ...prev, permissions: perms };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateRole(editing.id, form);
      } else {
        await createRole(form);
      }
      await load();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteRole(id);
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(null);
    }
  }

  const permCount = (perms) => {
    if (!perms) return 0;
    return Object.values(perms).filter(Boolean).length;
  };

  const totalPerms = Object.values(permissionsDef).reduce(
    (sum, g) => sum + Object.keys(g).length, 0,
  );

  if (error && !modalOpen) {
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
          <h1 className="page-title">Roles</h1>
          <p className="page-subtitle">{roles.length} roles configured</p>
        </div>
        {canCreate && (
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={openCreate}>
            <Plus size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            Create Role
          </button>
        )}
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ROLE NAME</th>
              <th>DESCRIPTION</th>
              <th>USERS</th>
              <th>PERMISSIONS</th>
              <th style={{ width: 100 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td className="name">
                  <Shield size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--teal)' }} />
                  {role.name}
                </td>
                <td className="muted">{role.description || '—'}</td>
                <td>
                  <span className="pill blue">{role.user_count || 0}</span>
                </td>
                <td>
                  <span className="pill teal">{permCount(role.permissions)} / {totalPerms}</span>
                </td>
                <td>
                  {role.name !== 'Super Admin' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {canEdit && (
                        <button className="icon-btn" title="Edit" onClick={() => openEdit(role)}>
                          <Edit2 size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button className="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(role)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                  {role.name === 'Super Admin' && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Protected</span>
                  )}
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No roles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Role</h3>
              <button className="icon-btn" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
              {(deleteConfirm.user_count || 0) > 0 && (
                <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>
                  This role has {deleteConfirm.user_count} user(s). Reassign them first.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={(deleteConfirm.user_count || 0) > 0}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Role' : 'Create Role'}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Role Name</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Booking Manager"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Permissions</label>
                  <div className="permissions-grid">
                    {Object.entries(permissionsDef).map(([category, perms]) => {
                      const keys = Object.keys(perms);
                      const checked = keys.filter(k => form.permissions[k]).length;
                      return (
                        <div key={category} className="permission-category">
                          <div className="permission-category-header" onClick={() => toggleCategory(category)}>
                            <div className="permission-checkbox-wrap">
                              <input
                                type="checkbox"
                                checked={checked === keys.length}
                                ref={el => { if (el) el.indeterminate = checked > 0 && checked < keys.length; }}
                                onChange={() => toggleCategory(category)}
                              />
                              <span className="permission-category-name">{category}</span>
                            </div>
                            <span className="permission-count">{checked}/{keys.length}</span>
                          </div>
                          <div className="permission-items">
                            {Object.entries(perms).map(([key, label]) => (
                              <label key={key} className="permission-item">
                                <input
                                  type="checkbox"
                                  checked={!!form.permissions[key]}
                                  onChange={() => togglePermission(key)}
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} disabled={saving}>
                  {saving ? 'Saving...' : (editing ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
