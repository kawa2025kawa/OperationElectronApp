import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { login } from "@shared/api/commands";
import { useAppStore } from "@shared/store";

export const useAuth = () => {
  const {
    isAuthenticated,
    isLoginProcessing,
    handleLoginSuccess,
    logout,
    setIsLoginProcessing,
  } = useAppStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      isLoginProcessing: s.isLoginProcessing,
      handleLoginSuccess: s.handleLoginSuccess,
      logout: s.logout,
      setIsLoginProcessing: s.setIsLoginProcessing,
    })),
  );

  const handleLogin = async (): Promise<void> => {
    // ログイン処理中は二重実行しない
    if (isLoginProcessing) {
      console.warn("[Auth] Login is already in progress.");
      return;
    }

    setIsLoginProcessing(true);

    try {
      console.log("[Auth] Starting Google login...");

      const session = await login();

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

      toast.error(
        error instanceof Error ? error.message : "ログインに失敗しました",
      );

      setIsLoginProcessing(false);
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
