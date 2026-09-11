// src/renderer/components/ui/auth/AuthCard.tsx

import React from "react";
import { clsx } from "clsx";
import * as styles from "./authCard.css";

export interface AuthCardProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
  familyName?: string | null;
  buttonText: string;
  isButtonDisabled?: boolean;
  onButtonClick: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = React.memo(
  ({
    isAuthenticated,
    userEmail,
    familyName,
    buttonText,
    isButtonDisabled = false,
    onButtonClick,
  }) => {
    return (
      <div className={styles.container}>
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
            onClick={onButtonClick}
            disabled={isButtonDisabled}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  },
);

AuthCard.displayName = "AuthCard";
