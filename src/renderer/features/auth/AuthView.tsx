// src/renderer/features/auth/AuthView.tsx

import { memo } from "react";
import { clsx } from "clsx";
import { useAuthView } from "./useAuthView";
import * as styles from "./authView.css";

export const AuthView = memo(() => {
  const {
    isAuthenticated,
    isButtonDisabled,
    buttonText,
    handleAuthToggle,
  } = useAuthView();

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

        <div className={styles.buttonWrapper}>
          <button
            type="button"
            className={styles.authButton}
            onClick={handleAuthToggle}
            disabled={isButtonDisabled}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
});

AuthView.displayName = "AuthView";