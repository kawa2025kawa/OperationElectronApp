// src/renderer/features/auth/AuthView.tsx

import { memo, useCallback } from "react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { AuthState } from "@shared/types/auth/authTypes";
import * as styles from "./authView.css";

const AUTH_BUTTON_TEXT: Record<AuthState, string> = {
  loading: "Processing...",
  loggedIn: "Logout",
  loggedOut: "Login with Google",
};

export const AuthView = memo(() => {
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

  return (
    <div className={styles.viewContainer}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.googleBlue}>G</span>
          <span className={styles.googleRed}>o</span>
          <span className={styles.googleYellow}>o</span>
          <span className={styles.googleBlue}>g</span>
          <span className={styles.googleGreen}>l</span>
          <span className={styles.googleRed}>e</span>
        </div>

        <h2 className={styles.title}>Account Status</h2>

        <div
          className={clsx(
            styles.status,
            isAuthenticated ? styles.statusLoggedIn : styles.statusLoggedOut,
          )}
        >
          Status:{" "}
          <strong
            className={clsx(
              styles.statusText,
              isAuthenticated
                ? styles.statusTextLoggedIn
                : styles.statusTextLoggedOut,
            )}
          >
            {isAuthenticated ? "Logged In" : "Not Logged In"}
          </strong>
        </div>

        <div className={styles.accountSection}>
          <div className={styles.accountInfoRow}>
            <span className={styles.accountInfoLabel}>Email</span>
            <span
              className={clsx(
                styles.accountInfoValue,
                !userEmail && styles.accountInfoEmpty,
              )}
            >
              {userEmail ?? "未ログイン"}
            </span>
          </div>

          <div className={styles.accountInfoRow}>
            <span className={styles.accountInfoLabel}>姓</span>
            <span
              className={clsx(
                styles.accountInfoValue,
                !familyName && styles.accountInfoEmpty,
              )}
            >
              {familyName ?? "未取得"}
            </span>
          </div>
        </div>

        <div className={styles.buttonWrapper}>
          <button
            type="button"
            className={styles.authButton}
            onClick={handleAuthToggle}
            disabled={authState === "loading"}
          >
            {AUTH_BUTTON_TEXT[authState]}
          </button>
        </div>
      </div>
    </div>
  );
});

AuthView.displayName = "AuthView";
