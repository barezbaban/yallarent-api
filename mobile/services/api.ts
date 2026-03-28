import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://yallarent-api-production.up.railway.app/api';

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export interface Car {
  id: string;
  company_id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  city: string;
  image_url: string | null;
  description: string | null;
  is_available: boolean;
  created_at: string;
  company_name: string;
  company_city: string;
  company_phone?: string;
}

export interface Booking {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  make?: string;
  model?: string;
  year?: number;
  image_url?: string;
  company_name?: string;
}

export interface AuthResponse {
  user: { id: string; full_name: string; phone: string; city?: string };
  token: string;
}

export const authApi = {
  login: (phone: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
  signup: (fullName: string, phone: string, password: string, city: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone, password, city }),
    }),
};

export const carsApi = {
  list: (params?: { city?: string; min_price?: number; max_price?: number }) => {
    const query = new URLSearchParams();
    if (params?.city) query.set('city', params.city);
    if (params?.min_price) query.set('min_price', String(params.min_price));
    if (params?.max_price) query.set('max_price', String(params.max_price));
    const qs = query.toString();
    return request<Car[]>(`/cars${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => request<Car>(`/cars/${id}`),
};

export const favoritesApi = {
  list: () => request<{ id: string; car_id: string; make: string; model: string; year: number; price_per_day: number; city: string; image_url: string | null; company_name: string }[]>('/favorites'),
  getIds: () => request<string[]>('/favorites/ids'),
  add: (carId: string) => request<{ message: string }>('/favorites', { method: 'POST', body: JSON.stringify({ carId }) }),
  remove: (carId: string) => request<{ message: string }>(`/favorites/${carId}`, { method: 'DELETE' }),
};

export const bookingsApi = {
  list: () => request<Booking[]>('/bookings'),
  create: (data: { carId: string; startDate: string; endDate: string }) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    request<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
};
