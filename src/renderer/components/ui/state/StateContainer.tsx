// src/renderer/components/ui/state/StateContainer.tsx
import React from "react";
import * as styles from "./stateContainer.css";

// 1. ベースとなる StateContainer
interface StateContainerProps {
  icon?: React.ReactNode;
  title: string;
  message?: string | undefined;
  children?: React.ReactNode;
}

const StateContainer: React.FC<StateContainerProps> = React.memo(
  ({ icon, title, message, children }) => {
    return (
      <div className={styles.stateContainer}>
        {icon && <div>{icon}</div>}
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        {children}
      </div>
    );
  },
);
StateContainer.displayName = "StateContainer";

// 2. 成功状態 (SuccessState)
interface SuccessStateProps {
  title?: string;
  message?: string;
  onClickOk: () => void;
  children?: React.ReactNode;
}

const SuccessState: React.FC<SuccessStateProps> = React.memo(
  ({ title = "処理完了", message, onClickOk, children }) => {
    return (
      <>
        <StateContainer
          title={title}
          icon={<div className={styles.successIcon}>✓</div>}
          message={message}
        >
          {children}
        </StateContainer>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onClickOk}
          >
            OK
          </button>
        </div>
      </>
    );
  },
);
SuccessState.displayName = "SuccessState";

// 3. エラー状態 (ErrorState)
interface ErrorStateProps {
  title?: string;
  errorMessage: string;
  onClickRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = React.memo(
  ({ title = "処理に失敗しました", errorMessage, onClickRetry }) => {
    return (
      <>
        <StateContainer
          title={title}
          icon={<div className={styles.errorIcon}>⚠</div>}
        >
          <p className={styles.errorText}>{errorMessage}</p>
        </StateContainer>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onClickRetry}
          >
            再試行
          </button>
        </div>
      </>
    );
  },
);
ErrorState.displayName = "ErrorState";
