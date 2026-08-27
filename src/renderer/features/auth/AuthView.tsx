import React from "react";
import { clsx } from "clsx";

import { useAppStore } from "@shared/store";

import * as styles from "./authView.css";
import { useAuth } from "./useAuth";

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={clsx(styles.authCard, className)}>{children}</div>;

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={styles.authButton} {...props} />
);

const AUTH_BUTTON_TEXT = {
  loading: "Processing...",
  loggedIn: "Logout",
  loggedOut: "Login with Google",
} as const;

export const AuthView: React.FC = () => {
  const { isAuthenticated, authState, handleAuthToggle } = useAuth();

  const userEmail = useAppStore((state) => state.userEmail);
  const familyName = useAppStore((state) => state.familyName);

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.logo}>
          <span className={styles.googleBlue}>G</span>
          <span className={styles.googleRed}>o</span>
          <span className={styles.googleYellow}>o</span>
          <span className={styles.googleBlue}>g</span>
          <span className={styles.googleGreen}>l</span>
          <span className={styles.googleRed}>e</span>
        </div>

        <h2 className={styles.title}>Account Status</h2>

        <div className={styles.status}>
          Status:{" "}
          <strong>{isAuthenticated ? "Logged In" : "Not Logged In"}</strong>
        </div>

        <div className={styles.accountSection}>
          <h3 className={styles.accountTitle}>Google Account</h3>

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
          <Button onClick={handleAuthToggle} disabled={authState === "loading"}>
            {AUTH_BUTTON_TEXT[authState as keyof typeof AUTH_BUTTON_TEXT]}
          </Button>
        </div>
      </Card>
    </div>
  );
};

AuthView;
