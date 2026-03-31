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
  guestMode: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (fullName: string, phone: string, password: string, city: string, email?: string) => Promise<string>;
  verifySignup: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: { full_name: string; phone: string; city?: string }) => void;
  enterGuestMode: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  guestMode: false,
  login: async () => {},
  signup: async () => '',
  verifySignup: async () => {},
  logout: () => {},
  updateUser: () => {},
  enterGuestMode: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
