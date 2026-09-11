// src/renderer/features/auth/store/authSlice.ts

import type { StateCreator } from "zustand";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import type {
  AuthProfile,
  AuthSlice,
  GoogleUserInfo,
} from "@shared/types/auth/authTypes";

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// ============================================================
// Google UserInfo API
// ============================================================

async function fetchUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Auth] Google UserInfo API failed: ${response.status}`);
      return null;
    }

    return (await response.json()) as GoogleUserInfo;
  } catch (error) {
    console.error("[Auth] Failed to fetch Google user info:", error);
    return null;
  }
}

// ============================================================
// Profile Processing
// ============================================================

function normalize(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

async function resolveAuthProfile(
  accessToken: string,
  email?: string | null,
  familyName?: string | null,
): Promise<AuthProfile> {
  const resolvedEmail = normalize(email);
  const resolvedFamilyName = normalize(familyName);

  if (resolvedEmail && resolvedFamilyName) {
    return {
      email: resolvedEmail,
      familyName: resolvedFamilyName,
    };
  }

  const userInfo = await fetchUserInfo(accessToken);

  return {
    email: resolvedEmail ?? normalize(userInfo?.email),
    familyName: resolvedFamilyName ?? normalize(userInfo?.family_name),
  };
}

// ============================================================
// State Mutators
// ============================================================

function clearAuthState(state: AppState): void {
  state.isAuthenticated = false;
  state.isChecking = false;
  state.accessToken = null;
  state.userEmail = null;
  state.familyName = null;
}

function applyAuthenticatedState(
  state: AppState,
  accessToken: string,
  profile: AuthProfile,
): void {
  state.accessToken = accessToken;
  state.isAuthenticated = true;
  state.userEmail = profile.email;
  state.familyName = profile.familyName;
}

// ============================================================
// Slice Implementation
// ============================================================

export type { AuthSlice } from "@shared/types/auth/authTypes";

export const createAuthSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => ({
  isAuthenticated: false,
  isChecking: false,

  accessToken: null,
  userEmail: null,
  familyName: null,

  setIsAuthenticated: (auth) =>
    set((state) => {
      state.isAuthenticated = auth;
    }),

  setIsChecking: (check) =>
    set((state) => {
      state.isChecking = check;
    }),

  setAccessToken: (token) =>
    set((state) => {
      state.accessToken = token;
    }),

  setUserEmail: (email) =>
    set((state) => {
      state.userEmail = email;
    }),

  setFamilyName: (familyName) =>
    set((state) => {
      state.familyName = familyName;
    }),

  checkAuthStatus: async (): Promise<boolean> => {
    set((state) => {
      state.isChecking = true;
    });

    try {
      const session = await commands.loadAuthSession();

      if (!session?.accessToken) {
        set((state) => {
          clearAuthState(state);
        });
        return false;
      }

      const profile = await resolveAuthProfile(
        session.accessToken,
        session.email,
        session.familyName,
      );

      set((state) => {
        applyAuthenticatedState(state, session.accessToken, profile);
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

  handleLoginSuccess: async (accessToken, email, familyName): Promise<void> => {
    const profile = await resolveAuthProfile(accessToken, email, familyName);

    set((state) => {
      applyAuthenticatedState(state, accessToken, profile);
    });

    void get().prefetchSheets(accessToken);
  },

  logout: async (): Promise<void> => {
    try {
      await commands.logout();
      set((state) => {
        clearAuthState(state);
      });
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
    }
  },
});
