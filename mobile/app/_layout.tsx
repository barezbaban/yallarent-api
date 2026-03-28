import { useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { AuthContext } from '../services/auth';
import { authApi, setAuthToken } from '../services/api';
import type { User } from '../services/auth';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await authApi.login(phone, password);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (fullName: string, phone: string, password: string, city: string) => {
    const res = await authApi.signup(fullName, phone, password, city);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surfacePrimary },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="splash"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="car/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="book/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="booking-confirmed"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </AuthContext.Provider>
  );
}
