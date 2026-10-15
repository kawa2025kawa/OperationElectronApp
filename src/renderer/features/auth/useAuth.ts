// src/renderer/features/auth/useAuth.ts

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { AuthState } from "@shared/types/auth/authTypes";

export const useAuth = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isAuthenticated,
    isChecking,
    userEmail,
    familyName,
    login,
    logout,
    setGlobalProcessing,
  } = useAppStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isChecking: state.isChecking,
      userEmail: state.userEmail,
      familyName: state.familyName,
      login: state.login,
      logout: state.logout,
      setGlobalProcessing: state.setGlobalProcessing,
    })),
  );

  const handleLogin = useCallback(async (): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);
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
      setIsProcessing(false);
      setGlobalProcessing(null);
    }
  }, [isProcessing, login, setGlobalProcessing]);

  const handleLogout = useCallback(async (): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await logout();
      toast.success("ログアウトしました");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      toast.error("ログアウトに失敗しました");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, logout]);

  const handleAuthToggle = useCallback((): void => {
    if (isProcessing || isChecking) return;
    if (isAuthenticated) {
      void handleLogout();
    } else {
      void handleLogin();
    }
  }, [isProcessing, isChecking, isAuthenticated, handleLogout, handleLogin]);

  const authState: AuthState =
    isProcessing || isChecking
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
