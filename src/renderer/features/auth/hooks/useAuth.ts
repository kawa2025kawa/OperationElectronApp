import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store/index";

export const useAuth = () => {
  const { isAuthenticated, isLoginProcessing, handleLoginSuccess, logout, setIsLoginProcessing } =
    useAppStore(
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
      // Main プロセス側で 認証 ➔ トークン交換 ➔ Keytar保存 まで一括実行
      const session = await window.electronAPI.invoke<{
        accessToken: string;
      }>("googleAuth:login");

      if (!session?.accessToken) {
        throw new Error("アクセストークンの取得に失敗しました");
      }

      // ストアの状態を更新 ＆ スプレッドシート読み込みを完了
      await handleLoginSuccess(session.accessToken);
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      toast.error(error instanceof Error ? error.message : "ログインに失敗しました");
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
