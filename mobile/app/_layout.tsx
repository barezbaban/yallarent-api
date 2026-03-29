import { useState, useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/theme';
import { AuthContext } from '../services/auth';
import { authApi, setAuthToken } from '../services/api';
import { AlertProvider } from '../services/alert';
import { LanguageProvider } from '../services/language';
import { registerForPushNotifications, unregisterPushNotifications } from '../services/notifications';
import type { User } from '../services/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const PUSH_TOKEN_KEY = 'push_token';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Hydrate auth state from secure storage on launch
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Re-register push token on app launch
          registerForPushNotifications().then(async (pt) => {
            if (pt) await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pt);
          }).catch(() => {});
        }
      } catch {}
      setIsReady(true);
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await authApi.login(phone, password);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user));
    // Register for push notifications after login
    const pushToken = await registerForPushNotifications();
    if (pushToken) await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
  }, []);

  const signup = useCallback(async (fullName: string, phone: string, password: string, city: string) => {
    const res = await authApi.signup(fullName, phone, password, city);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user));
    const pushToken = await registerForPushNotifications();
    if (pushToken) await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
  }, []);

  const logout = useCallback(async () => {
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (pushToken) {
      await unregisterPushNotifications(pushToken);
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    }
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }, []);

  const updateUser = useCallback(async (data: { full_name: string; phone: string; city?: string }) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...data } : null;
      if (updated) {
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  if (!isReady) return null;

  return (
    <LanguageProvider>
    <AlertProvider>
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser }}>
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
          name="onboarding"
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
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="verify-otp"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="favorites"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="notifications"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="settings"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="help"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </AuthContext.Provider>
    </AlertProvider>
    </LanguageProvider>
  );
}
