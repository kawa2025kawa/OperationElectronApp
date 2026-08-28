import { useState } from "react";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
import { useShallow } from "zustand/react/shallow";

import { commands } from "@shared/service/commands";
import { useAppStore } from "@shared/store";

// タイムアウト時間（例: 3分）
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

  const handleLogin = async (): Promise<void> => {
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
      console.log("[Auth] Starting Google login...");

      // ブラウザを閉じたまま放置された場合のフロント側タイムアウト保護
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

      console.log("[Auth] Google login completed.");
    } catch (error) {
      console.error("[Auth] Login failed:", error);

      usePollingToastStore
        .getState()
        .addToast(
          error instanceof Error ? error.message : "ログインに失敗しました",
          "error",
        );
    } finally {
      // 成功・失敗・タイムアウトのいずれでも必ずローディングを解除する
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
