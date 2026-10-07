// src/renderer/features/auth/store/authSlice.ts

import type { StateCreator } from "zustand";
import { authCommands } from "@renderer/services/commands";
import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import type { AppState } from "@renderer/store";
import type { AuthProfile, AuthSlice } from "@shared/types/auth/authTypes";

function normalize(value?: string | null): string | null {
  const normalized = value?.trim();

  return normalized || null;
}

function clearAuthState(state: AppState): void {
  state.isAuthenticated = false;
  state.isChecking = false;
  state.userEmail = null;
  state.familyName = null;
}

function applyAuthenticatedState(state: AppState, profile: AuthProfile): void {
  state.isAuthenticated = true;
  state.userEmail = profile.email;
  state.familyName = profile.familyName;
}

export type { AuthSlice } from "@shared/types/auth/authTypes";

export const createAuthSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => ({
  isAuthenticated: false,
  isChecking: false,
  userEmail: null,
  familyName: null,

  setIsAuthenticated: (auth) => {
    set((state) => {
      state.isAuthenticated = auth;
    });
  },

  setIsChecking: (check) => {
    set((state) => {
      state.isChecking = check;
    });
  },

  setUserEmail: (email) => {
    set((state) => {
      state.userEmail = email;
    });
  },

  setFamilyName: (familyName) => {
    set((state) => {
      state.familyName = familyName;
    });
  },

  checkAuthStatus: async (forceRefresh = false): Promise<boolean> => {
    set((state) => {
      state.isChecking = true;
    });

    try {
      const profile = await authCommands.loadAuthSession(forceRefresh);

      if (!profile) {
        set((state) => {
          clearAuthState(state);
        });

        return false;
      }

      const normalizedProfile: AuthProfile = {
        email: normalize(profile.email),
        familyName: normalize(profile.familyName),
      };

      set((state) => {
        applyAuthenticatedState(state, normalizedProfile);
      });

      return true;
    } catch (error) {
      console.error("[Auth] Session check failed:", error);

      set((state) => {
        clearAuthState(state);
      });

      return false;
    } finally {
      set((state) => {
        state.isChecking = false;
      });
    }
  },

  handleLoginSuccess: async (email, familyName): Promise<void> => {
    try {
      const profile: AuthProfile = {
        email: normalize(email),
        familyName: normalize(familyName),
      };

      set((state) => {
        applyAuthenticatedState(state, profile);
      });
    } catch (error) {
      console.error("[Auth] Login success handler failed:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    console.trace("[Auth] logout called");

    try {
      await authCommands.logout();
    } catch (error) {
      console.error("[Auth] Logout command failed:", error);
    } finally {
      set((state) => {
        clearAuthState(state);
      });

      get().setCurrentView(APP_VIEW_IDS.AUTH);
    }
  },
});
