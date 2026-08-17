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

  const handleLogin = async () => {
    setIsLoginProcessing(true);

    try {
      const session = await login();

      if (!session?.accessToken) {
        throw new Error("アクセストークンの取得に失敗しました");
      }

      await handleLoginSuccess(session.accessToken);
    } catch (error) {
      console.error("[Auth] Login failed:", error);

      toast.error(
        error instanceof Error ? error.message : "ログインに失敗しました",
      );

      setIsLoginProcessing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleAuthToggle = () => {
    if (isAuthenticated) {
      void handleLogout();
    } else {
      void handleLogin();
    }
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
