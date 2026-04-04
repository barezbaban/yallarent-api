const PORTAL_BASE = '/api/portal';
const BACKOFFICE_BASE = '/api/backoffice';

export function getToken() {
  return localStorage.getItem('portal_token');
}

async function request(path, options = {}, base = PORTAL_BASE, { skipAuthRedirect = false } = {}) {
  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !skipAuthRedirect) {
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
export async function login(username, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, BACKOFFICE_BASE, { skipAuthRedirect: true });
  const user = data.admin || data.user;
  localStorage.setItem('portal_token', data.token);
  localStorage.setItem('portal_admin', JSON.stringify(user));
  localStorage.setItem('portal_permissions', JSON.stringify(user.permissions || {}));
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  return backofficeRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
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
  const admin = getAdmin();
  if (admin?.role === 'superadmin' || admin?.role === 'admin') return true;
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

// ── Chat / Support ──
const AGENT_CHAT_BASE = '/api/agent/chat';

function agentChatRequest(path, options = {}) {
  return request(path, options, AGENT_CHAT_BASE);
}

export async function fetchChatConversations(params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return agentChatRequest(`/conversations${qs ? `?${qs}` : ''}`);
}

export async function fetchChatConversation(id) {
  return agentChatRequest(`/conversations/${id}`);
}

export async function fetchChatMessages(id, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return agentChatRequest(`/conversations/${id}/messages${qs ? `?${qs}` : ''}`);
}

export async function sendAgentMessage(conversationId, data) {
  return agentChatRequest(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateConversation(id, data) {
  return agentChatRequest(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchChatNotes(id) {
  return agentChatRequest(`/conversations/${id}/notes`);
}

export async function addChatNote(id, data) {
  return agentChatRequest(`/conversations/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchCannedResponses() {
  return agentChatRequest('/canned-responses');
}

export async function fetchConversationRating(conversationId) {
  return agentChatRequest(`/conversations/${conversationId}/rating`).catch(() => null);
}

export async function fetchRatingsSummary() {
  return agentChatRequest('/ratings/summary');
}
