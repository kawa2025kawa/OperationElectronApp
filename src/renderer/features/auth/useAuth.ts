// src/renderer/features/auth/useAuth.ts

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import type { AuthState } from "@shared/types/auth/authTypes";

const AUTH_TIMEOUT_MS = 180000;

export const useAuth = () => {
  const [isLoginProcessing, setIsLoginProcessing] = useState(false);

  const { isAuthenticated, handleLoginSuccess, logout, setGlobalProcessing } =
    useAppStore(
      useShallow((state) => ({
        isAuthenticated: state.isAuthenticated,
        handleLoginSuccess: state.handleLoginSuccess,
        logout: state.logout,
        setGlobalProcessing: state.setGlobalProcessing,
      })),
    );

  const handleLogin = useCallback(async (): Promise<void> => {
    if (isLoginProcessing) return;

    setIsLoginProcessing(true);
    setGlobalProcessing({
      message: "ブラウザで認証を行ってください...",
      target: "Google OAuth Login",
    });

    try {
      const loginPromise = commands.login();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("認証タイムアウト：ログイン処理が中断されました")),
          AUTH_TIMEOUT_MS,
        ),
      );

      const session = await Promise.race([loginPromise, timeoutPromise]);

      if (!session?.accessToken) {
        throw new Error("アクセストークンの取得に失敗しました");
      }

      setGlobalProcessing({
        message: "アカウント情報を同期中...",
        target: session.email ?? "Google Account",
      });

      await handleLoginSuccess(
        session.accessToken,
        session.email,
        session.familyName,
      );
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      const message =
        error instanceof Error ? error.message : "ログインに失敗しました";
      toast.error(message);
    } finally {
      setIsLoginProcessing(false);
      setGlobalProcessing(null);
    }
  }, [isLoginProcessing, handleLoginSuccess, setGlobalProcessing]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
      toast.success("ログアウトしました");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      toast.error("ログアウトに失敗しました");
    }
  }, [logout]);

  const handleAuthToggle = useCallback((): void => {
    if (isLoginProcessing) return;

    if (isAuthenticated) {
      void handleLogout();
    } else {
      void handleLogin();
    }
  }, [isLoginProcessing, isAuthenticated, handleLogout, handleLogin]);

  const authState: AuthState = isLoginProcessing
    ? "loading"
    : isAuthenticated
      ? "loggedIn"
      : "loggedOut";

  return {
    isAuthenticated,
    authState,
    handleAuthToggle,
  };
};
