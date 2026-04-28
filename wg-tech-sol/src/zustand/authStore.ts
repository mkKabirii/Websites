"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";


interface AuthUser {
  _id: string;
  fullname: string;
  email: string;
  username?: string;
  profilePicture?: string;
  profileImage?: string; // ✅ Add kiya
  nationalId?: string | null;
  designation?: string;
  userType?: string;
  role?: string; // ✅ Add kiya
  assignedClients?: string[]; // ✅ Add kiya
}

// interface AuthUser {
//   _id: string;
//   fullname: string;
//   email: string;
//   username?: string; // Alternative to fullname
//   profilePicture?: string;
//   nationalId?: string | null;
//   designation?: string; // Role/user type (e.g., "client", "admin", "user")
//   userType?: string; // Alternative field for user type
// }

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (data: { token: string; user: AuthUser }) => void;
  clearAuth: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (data) => set({ user: data.user, token: data.token }),
      clearAuth: () => set({ user: null, token: null }),
      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: "auth-storage", // localStorage key
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);