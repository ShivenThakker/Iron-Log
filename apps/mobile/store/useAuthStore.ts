import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

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
    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userId', userId);
    set({ token, userId, isAuthenticated: true });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');
    set({ token: null, userId: null, isAuthenticated: false });
  },
  init: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const userId = await SecureStore.getItemAsync('userId');
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
