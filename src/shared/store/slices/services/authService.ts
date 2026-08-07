// src/shared/store/slices/services/authService.ts

import { toast } from "sonner";

import type { OAuthToken } from "@shared/types/authTypes";
import { unwrapResult } from "@shared/utils/apiUtils";

export const authService = {
  async checkSession(): Promise<boolean> {
    const res = await window.electronAPI.invoke<unknown>("checkAuthSession");

    return unwrapResult(res) as boolean;
  },

  async getOauthCredentials(): Promise<string | null> {
    const res = await window.electronAPI.invoke<unknown>("getGoogleClientId");

    return unwrapResult(res) as string | null;
  },

  async refreshCredentials(): Promise<string | null> {
    const res = await window.electronAPI.invoke<unknown>("refreshGoogleOauthCredentials");

    return unwrapResult(res) as string | null;
  },

  async saveSession(
    accessToken: string,
    expiresInSeconds: number | null,
    refreshToken: string | null = null,
  ): Promise<void> {
    const tokenPayload: OAuthToken = {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      idToken: null,
    };

    await window.electronAPI.invoke("saveAuthSession", tokenPayload);
  },

  async clearSession(): Promise<void> {
    await window.electronAPI.invoke("clearAuthSession");

    toast.success("ログアウトしました");
  },
};
