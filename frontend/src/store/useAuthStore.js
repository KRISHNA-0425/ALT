import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      advocate: null,

      login: (user, token, advocate = null) => set({ user, token, advocate }),
      setAuth: (user, token, advocate = null) => set({ user, token, advocate }),
      setAdvocate: (advocate) => set({ advocate }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, advocate: null });
      },
    }),
    {
      name: 'auth-storage', // Key used in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);