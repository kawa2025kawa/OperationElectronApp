// src/renderer/features/auth/AuthView.tsx

import React from "react";
import { AuthCard } from "@renderer/components/ui/auth/AuthCard";
import { useAppStore } from "@renderer/store";
import type { AuthState } from "@shared/types/auth/authTypes";
import * as styles from "./authView.css";
import { useAuth } from "./useAuth";

const AUTH_BUTTON_TEXT: Record<AuthState, string> = {
  loading: "Processing...",
  loggedIn: "Logout",
  loggedOut: "Login with Google",
} as const;

export const AuthView: React.FC = React.memo(() => {
  const { isAuthenticated, authState, handleAuthToggle } = useAuth();
  const userEmail = useAppStore((state) => state.userEmail);
  const familyName = useAppStore((state) => state.familyName);

  return (
    <div className={styles.viewContainer}>
      <AuthCard
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        familyName={familyName}
        buttonText={AUTH_BUTTON_TEXT[authState]}
        isButtonDisabled={authState === "loading"}
        onButtonClick={handleAuthToggle}
      />
    </div>
  );
});

AuthView.displayName = "AuthView";
