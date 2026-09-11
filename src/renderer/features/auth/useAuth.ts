// src/renderer/features/auth/useAuth.ts

import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
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
    if (isLoginProcessing) {
      console.warn("[Auth] Login is already in progress.");
      return;
    }

    setIsLoginProcessing(true);
    setGlobalProcessing({
      message: "認証処理中（ブラウザでログインを完了してください）...",
      target: "認証処理中",
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

      await handleLoginSuccess(
        session.accessToken,
        session.email,
        session.familyName,
      );
    } catch (error) {
      console.error("[Auth] Login failed:", error);

      usePollingToastStore
        .getState()
        .addToast(
          error instanceof Error ? error.message : "ログインに失敗しました",
          "error",
        );
    } finally {
      setIsLoginProcessing(false);
      setGlobalProcessing(null);
    }
  }, [isLoginProcessing, handleLoginSuccess, setGlobalProcessing]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
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
