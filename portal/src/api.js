const PORTAL_BASE = '/api/portal';
const BACKOFFICE_BASE = '/api/backoffice';

function getToken() {
  return localStorage.getItem('portal_token');
}

async function request(path, options = {}, base = PORTAL_BASE) {
  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_admin');
    localStorage.removeItem('portal_permissions');
    window.location.href = '/portal/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function backofficeRequest(path, options = {}) {
  return request(path, options, BACKOFFICE_BASE);
}

// ── Auth ──
export async function login(email, password) {
  const data = await backofficeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('portal_token', data.token);
  localStorage.setItem('portal_admin', JSON.stringify(data.user));
  localStorage.setItem('portal_permissions', JSON.stringify(data.user.permissions || {}));
  return data;
}

export function logout() {
  localStorage.removeItem('portal_token');
  localStorage.removeItem('portal_admin');
  localStorage.removeItem('portal_permissions');
}

export function getAdmin() {
  const raw = localStorage.getItem('portal_admin');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getToken();
}

export function getPermissions() {
  const raw = localStorage.getItem('portal_permissions');
  return raw ? JSON.parse(raw) : {};
}

export function hasPermission(key) {
  const perms = getPermissions();
  return perms[key] === true;
}

export async function refreshPermissions() {
  const data = await backofficeRequest('/auth/me');
  localStorage.setItem('portal_permissions', JSON.stringify(data.permissions || {}));
  localStorage.setItem('portal_admin', JSON.stringify({
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    roleId: data.roleId,
    roleName: data.roleName,
    permissions: data.permissions,
  }));
  return data;
}

// ── Portal (existing endpoints) ──
export async function fetchDashboard() {
  return request('/dashboard');
}

export async function fetchMe() {
  return backofficeRequest('/auth/me');
}

// ── Companies / Partners ──
const COMPANIES_BASE = '/api/companies';

export async function fetchCompanies() {
  const token = getToken();
  const res = await fetch(COMPANIES_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchCompany(id) {
  const token = getToken();
  const res = await fetch(`${COMPANIES_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Company not found');
  return res.json();
}

export async function fetchCompanyCars(id) {
  const token = getToken();
  const res = await fetch(`${COMPANIES_BASE}/${id}/cars`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ── Roles ──
export async function fetchRoles() {
  return backofficeRequest('/roles');
}

export async function fetchRole(id) {
  return backofficeRequest(`/roles/${id}`);
}

export async function createRole(data) {
  return backofficeRequest('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(id, data) {
  return backofficeRequest(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRole(id) {
  return backofficeRequest(`/roles/${id}`, { method: 'DELETE' });
}

export async function fetchPermissionsList() {
  return backofficeRequest('/roles/permissions');
}

// ── Backoffice Users ──
export async function fetchBackofficeUsers() {
  return backofficeRequest('/users');
}

export async function fetchBackofficeUser(id) {
  return backofficeRequest(`/users/${id}`);
}

export async function createBackofficeUser(data) {
  return backofficeRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBackofficeUser(id, data) {
  return backofficeRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function resetBackofficeUserPassword(id) {
  return backofficeRequest(`/users/${id}/reset-password`, { method: 'POST' });
}
