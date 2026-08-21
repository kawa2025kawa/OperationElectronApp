// src/renderer/features/auth/useAuth.ts

import { useState } from "react";
import { useToastStore } from "@renderer/components/ui/toast/toastStore";
import { useShallow } from "zustand/react/shallow";

import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";

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

  const handleLogin = async (): Promise<void> => {
    if (isLoginProcessing) {
      console.warn("[Auth] Login is already in progress.");
      return;
    }

    setIsLoginProcessing(true);
    setGlobalProcessing({
      message: "認証処理中...",
      target: "認証処理中",
    });

    try {
      console.log("[Auth] Starting Google login...");

      const session = await commands.login();

      if (!session?.accessToken) {
        throw new Error("アクセストークンの取得に失敗しました");
      }

      await handleLoginSuccess(
        session.accessToken,
        session.email,
        session.familyName,
      );

      console.log("[Auth] Google login completed.");
    } catch (error) {
      console.error("[Auth] Login failed:", error);

      useToastStore
        .getState()
        .addToast(
          error instanceof Error ? error.message : "ログインに失敗しました",
          "error",
        );
    } finally {
      setIsLoginProcessing(false);
      setGlobalProcessing(null);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  const handleAuthToggle = (): void => {
    if (isLoginProcessing) {
      return;
    }

    if (isAuthenticated) {
      void handleLogout();
      return;
    }

    void handleLogin();
  };

  const authState = isLoginProcessing
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
