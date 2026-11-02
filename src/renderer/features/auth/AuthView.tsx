// src/renderer/features/auth/AuthView.tsx

import { memo } from "react";
import { clsx } from "clsx";
import type { AuthState } from "@shared/types/auth/authTypes";
import * as styles from "./authView.css";
import { useAuth } from "./useAuth";

const AUTH_BUTTON_TEXT: Record<AuthState, string> = {
  loading: "Processing...",
  loggedIn: "Logout",
  loggedOut: "Login with Google",
};

export const AuthView = memo(() => {
  const {
    isAuthenticated,
    userEmail,
    familyName,
    authState,
    handleAuthToggle,
  } = useAuth();

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
