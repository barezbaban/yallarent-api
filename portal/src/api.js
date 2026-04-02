const BASE = '/api/portal';

function getToken() {
  return localStorage.getItem('portal_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
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
    window.location.href = '/portal/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function login(email, password) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('portal_token', data.token);
  localStorage.setItem('portal_admin', JSON.stringify(data.admin));
  return data;
}

export function logout() {
  localStorage.removeItem('portal_token');
  localStorage.removeItem('portal_admin');
}

export function getAdmin() {
  const raw = localStorage.getItem('portal_admin');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getToken();
}

export async function fetchDashboard() {
  return request('/dashboard');
}

export async function fetchMe() {
  return request('/me');
}

// Companies / Partners
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
