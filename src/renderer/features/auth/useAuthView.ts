// src/renderer/features/auth/useAuthView.ts

import { useCallback } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { AuthState } from "@shared/types/auth/authTypes";

const AUTH_BUTTON_TEXT: Record<AuthState, string> = {
  loading: "Processing...",
  loggedIn: "Logout",
  loggedOut: "Login with Google",
};

export function useAuthView() {
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

  const handleAuthToggle = useCallback(async (): Promise<void> => {
    if (isProcessing) return;

    const isLogin = !isAuthenticated;
    const action = isLogin ? login : logout;

    setGlobalProcessing({
      message: isLogin ? "認証処理中..." : "ログアウト処理中...",
      target: isLogin ? "Google OAuth Login" : "Google OAuth Logout",
    });

    try {
      await action();
      toast.success(isLogin ? "ログインしました" : "ログアウトしました");
    } catch (error) {
      console.error(
        isLogin ? "[Auth] Login failed:" : "[Auth] Logout failed:",
        error,
      );

      if (isLogin) {
        toast.error(
          error instanceof Error ? error.message : "ログインに失敗しました",
        );
      } else {
        toast.error("ログアウトに失敗しました");
      }
    } finally {
      setGlobalProcessing(null);
    }
  }, [isProcessing, isAuthenticated, login, logout, setGlobalProcessing]);

  const authState: AuthState = isProcessing
    ? "loading"
    : isAuthenticated
      ? "loggedIn"
      : "loggedOut";

  return {
    isAuthenticated,
    userEmail,
    familyName,
    isButtonDisabled: authState === "loading",
    buttonText: AUTH_BUTTON_TEXT[authState],
    handleAuthToggle,
  };
}