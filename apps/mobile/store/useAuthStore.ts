import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AuthState {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (token: string, refreshToken: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isAuthenticated: false,
  isHydrated: false,
  login: async (token, refreshToken, userId) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
    } else {
      await SecureStore.setItemAsync('accessToken', token);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('userId', userId);
    }
    set({ token, userId, isAuthenticated: true });
  },
  logout: async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
    } else {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userId');
    }
    set({ token: null, userId: null, isAuthenticated: false });
  },
  init: async () => {
    try {
      let token: string | null = null;
      let userId: string | null = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('accessToken');
        userId = localStorage.getItem('userId');
      } else {
        token = await SecureStore.getItemAsync('accessToken');
        userId = await SecureStore.getItemAsync('userId');
      }
      if (token && userId) {
        set({ token, userId, isAuthenticated: true, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (e) {
      set({ isHydrated: true });
    }
  },
}));
