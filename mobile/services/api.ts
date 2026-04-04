import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://strong-recreation-dev.up.railway.app/api';

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

export interface CarImage {
  id: string;
  image_url: string;
  display_order: number;
}

export interface Car {
  id: string;
  company_id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  city: string;
  category: string;
  transmission: string;
  passengers: number;
  luggage: number;
  image_url: string | null;
  description: string | null;
  is_available: boolean;
  created_at: string;
  company_name: string;
  company_city: string;
  average_rating: number | null;
  review_count: number;
  company_phone?: string;
  company_address?: string;
  images?: CarImage[];
}

export interface Booking {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  pickup_time?: string;
  dropoff_time?: string;
  pickup_location?: string;
  dropoff_location?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  make?: string;
  model?: string;
  year?: number;
  image_url?: string;
  company_name?: string;
  has_review?: boolean;
}

export interface AuthResponse {
  user: { id: string; full_name: string; phone: string; email?: string; city?: string };
  token: string;
}

export interface SignupResponse {
  message: string;
  phone: string;
}

export const passwordApi = {
  requestReset: (phone: string) =>
    request<{ message: string }>('/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    request<{ resetToken: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),
  resetPassword: (phone: string, resetToken: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, resetToken, newPassword }),
    }),
};

export const authApi = {
  login: (phone: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
  signup: (fullName: string, phone: string, password: string, city: string, email?: string, language?: string) =>
    request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone, password, city, email, language }),
    }),
  verifySignup: (phone: string, otp: string) =>
    request<AuthResponse>('/auth/verify-signup', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),
  updateProfile: (data: { fullName?: string; city?: string }) =>
    request<{ id: string; full_name: string; phone: string; city?: string }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Company {
  id: string;
  name: string;
  city: string;
  phone: string;
  logo_url: string | null;
  address: string;
  is_active: boolean;
  created_at: string;
  car_count: number;
}

export const companiesApi = {
  list: () => request<Company[]>('/companies'),
  getById: (id: string) => request<Company>(`/companies/${id}`),
  getCars: (id: string) => request<Car[]>(`/companies/${id}/cars`),
};

export const carsApi = {
  list: (params?: { city?: string; min_price?: number; max_price?: number; category?: string; transmission?: string; min_passengers?: number; min_luggage?: number; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.city) query.set('city', params.city);
    if (params?.min_price) query.set('min_price', String(params.min_price));
    if (params?.max_price) query.set('max_price', String(params.max_price));
    if (params?.category) query.set('category', params.category);
    if (params?.transmission) query.set('transmission', params.transmission);
    if (params?.min_passengers) query.set('min_passengers', String(params.min_passengers));
    if (params?.min_luggage) query.set('min_luggage', String(params.min_luggage));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<PaginatedResponse<Car>>(`/cars${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => request<Car>(`/cars/${id}`),
};

export const favoritesApi = {
  list: () => request<{ id: string; car_id: string; make: string; model: string; year: number; price_per_day: number; city: string; image_url: string | null; company_name: string }[]>('/favorites'),
  getIds: () => request<string[]>('/favorites/ids'),
  add: (carId: string) => request<{ message: string }>('/favorites', { method: 'POST', body: JSON.stringify({ carId }) }),
  remove: (carId: string) => request<{ message: string }>(`/favorites/${carId}`, { method: 'DELETE' }),
};

export const devicesApi = {
  register: (pushToken: string, platform: string = 'ios') =>
    request<{ id: string }>('/devices', { method: 'POST', body: JSON.stringify({ pushToken, platform }) }),
  unregister: (pushToken: string) =>
    request<{ message: string }>('/devices', { method: 'DELETE', body: JSON.stringify({ pushToken }) }),
};

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: (page = 1, limit = 50) =>
    request<AppNotification[]>(`/notifications?page=${page}&limit=${limit}`),
  unreadCount: () =>
    request<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: string) =>
    request<AppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
};

export const bookingsApi = {
  list: () => request<Booking[]>('/bookings'),
  create: (data: { carId: string; startDate: string; endDate: string; pickupTime?: string; dropoffTime?: string; pickupLocation?: string; dropoffLocation?: string }) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    request<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
};

export interface Review {
  id: string;
  booking_id: string;
  car_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer_name: string;
}

export interface CarReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  reviewCount: number;
}

export const reviewsApi = {
  getByCarId: (carId: string, page = 1, limit = 10) =>
    request<CarReviewsResponse>(`/reviews/car/${carId}?page=${page}&limit=${limit}`),
  create: (data: { bookingId: string; rating: number; reviewText?: string }) =>
    request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'support';
  message: string;
  created_at: string;
}

export const supportApi = {
  getConversation: () =>
    request<{ id: string; user_id: string; status: string }>('/support/conversation'),
  getMessages: (page = 1, limit = 50) =>
    request<SupportMessage[]>(`/support/conversation/messages?page=${page}&limit=${limit}`),
  sendMessage: (message: string) =>
    request<SupportMessage>('/support/conversation/messages', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// ── Chat System ──
export interface ChatConversation {
  id: string;
  customer_id: string;
  subject: string | null;
  status: string;
  priority: string;
  category: string;
  unread_count_customer: number;
  unread_count_agent: number;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  agent_name?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'agent' | 'system';
  sender_id: string | null;
  content: string;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  is_read: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
}

export const chatApi = {
  getConversations: () =>
    request<ChatConversation[]>('/chat/conversations'),

  createConversation: (data: { subject?: string; category?: string; message: string; relatedBookingId?: string }) =>
    request<{ conversation: ChatConversation; message: ChatMessage }>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMessages: (conversationId: string, params?: { limit?: number; before?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.before) qs.set('before', params.before);
    const qsStr = qs.toString();
    return request<ChatMessage[]>(`/chat/conversations/${conversationId}/messages${qsStr ? `?${qsStr}` : ''}`);
  },

  sendMessage: (conversationId: string, data: { content: string; messageType?: string }) =>
    request<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUnreadCount: () =>
    request<{ unread: number }>('/chat/unread'),

  editMessage: (messageId: string, content: string) =>
    request<ChatMessage>(`/chat/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (messageId: string) =>
    request<ChatMessage>(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    }),

  uploadFile: async (conversationId: string, file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    formData.append('content', '');
    formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');

    const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${_token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Upload failed');
    }
    return res.json() as Promise<ChatMessage>;
  },
};
