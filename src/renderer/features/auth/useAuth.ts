// src/renderer/features/auth/useAuth.ts

import { useCallback } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { AuthState } from "@shared/types/auth/authTypes";

export const useAuth = () => {
  const {
    isAuthenticated,
    isChecking,
    isGlobalProcessing,
    userEmail,
    familyName,
    login,
    logout,
    setGlobalProcessing,
  } = useAppStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isChecking: state.isChecking,
      isGlobalProcessing: state.globalProcessing !== null,
      userEmail: state.userEmail,
      familyName: state.familyName,
      login: state.login,
      logout: state.logout,
      setGlobalProcessing: state.setGlobalProcessing,
    })),
  );

  const isProcessing = isChecking || isGlobalProcessing;

  const handleLogin = useCallback(async (): Promise<void> => {
    if (isProcessing) return;

    setGlobalProcessing({
      message: "認証処理中...",
      target: "Google OAuth Login",
    });

    try {
      await login();
      toast.success("ログインしました");
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      const message =
        error instanceof Error ? error.message : "ログインに失敗しました";
      toast.error(message);
    } finally {
      setGlobalProcessing(null);
    }
  }, [isProcessing, login, setGlobalProcessing]);

  const handleLogout = useCallback(async (): Promise<void> => {
    if (isProcessing) return;

    setGlobalProcessing({
      message: "ログアウト処理中...",
      target: "Google OAuth Logout",
    });

    try {
      await logout();
      toast.success("ログアウトしました");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      toast.error("ログアウトに失敗しました");
    } finally {
      setGlobalProcessing(null);
    }
  }, [isProcessing, logout, setGlobalProcessing]);

  const handleAuthToggle = useCallback((): void => {
    if (isProcessing) return;

    if (isAuthenticated) {
      void handleLogout();
    } else {
      void handleLogin();
    }
  }, [isProcessing, isAuthenticated, handleLogout, handleLogin]);

  const authState: AuthState = isProcessing
    ? "loading"
    : isAuthenticated
      ? "loggedIn"
      : "loggedOut";

  return {
    isAuthenticated,
    userEmail,
    familyName,
    authState,
    handleAuthToggle,
  };
};
