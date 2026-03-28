import { createContext, useContext } from 'react';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  city?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  signup: (fullName: string, phone: string, password: string, city: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: { full_name: string; phone: string; city?: string }) => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
