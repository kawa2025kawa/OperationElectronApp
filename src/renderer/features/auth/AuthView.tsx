//src\renderer\features\auth\AuthView.tsx

import React from "react";
import { clsx } from "clsx";
import { useAuth } from "./hooks/useAuth";
import * as styles from "./authView.css";

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

        <div className={styles.buttonWrapper}>
          <Button onClick={handleAuthToggle} disabled={authState === "loading"}>
            {AUTH_BUTTON_TEXT[authState as keyof typeof AUTH_BUTTON_TEXT]}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AuthView;
