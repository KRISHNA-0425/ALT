import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => set({ user, token }),
      setAuth: (user, token) => set({ user, token }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage', // Key used in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);