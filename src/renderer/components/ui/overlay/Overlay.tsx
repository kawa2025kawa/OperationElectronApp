// src/renderer/components/ui/overlay/Overlay.tsx

import type { ReactNode } from "react";
import { useAppStartupLoader, useProcessingLoader } from "./useOverlay";
import * as styles from "./overlay.css";

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
}

export const Overlay = ({ isOpen, onClick }: OverlayProps) => {
  const state = isOpen ? "open" : "closed";

  return (
    <div
      className={`${styles.backdropBase} ${styles.backdropStates[state]}`}
      onClick={onClick}
    />
  );
};

interface LoadingContentProps {
  message?: string;
  statusMessage?: string;
}

const DOT_DELAYS = [0, 0.2, 0.4];

const LoadingContent = ({
  message = "LOADING...",
  statusMessage = "INITIALIZING SYSTEM CORE",
}: LoadingContentProps) => (
  <div className={styles.contentWrapper}>
    <div className={styles.grid}>
      <div className={styles.scanline} />
      <div className={styles.content}>
        <div className={styles.title}>{message}</div>
        <div className={styles.dots}>
          {DOT_DELAYS.map((delay) => (
            <span
              key={delay}
              className={styles.dot}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
        <div className={styles.status}>{statusMessage}</div>
      </div>
    </div>
  </div>
);

interface LoaderTargetProps {
  value: string;
}

const LoaderTarget = ({ value }: LoaderTargetProps) => (
  <div className={styles.processingTargetPanel}>
    <span className={styles.processingTargetLabel}>PROCESSING TARGET</span>
    <span className={styles.processingTargetValue}>{value}</span>
  </div>
);

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  statusMessage?: string;
  children?: ReactNode;
}

const LoadingOverlay = ({
  isOpen,
  message = "SYSTEM INITIALIZING",
  statusMessage = "INITIALIZING SYSTEM CORE",
  children,
}: LoadingOverlayProps) => {
  const state = isOpen ? "active" : "inactive";

  return (
    <div
      className={`${styles.fullScreenLoaderBase} ${styles.fullScreenLoaderStates[state]}`}
    >
      <LoadingContent message={message} statusMessage={statusMessage} />
      {children}
    </div>
  );
};

export const AppStartupLoader = () => {
  const { showAppLoader, currentTarget, statusRows } = useAppStartupLoader();

  return (
    <LoadingOverlay
      isOpen={showAppLoader}
      message="INITIALIZING APPLICATION..."
      statusMessage="INITIALIZING SYSTEM CORE"
    >
      {currentTarget && <LoaderTarget value={currentTarget} />}

      <div className={styles.statusPanel}>
        {statusRows.map((row) => (
          <div className={styles.statusRow} key={row.key}>
            <span>{row.label}:</span>
            <span className={row.toneClass}>{row.value}</span>
          </div>
        ))}
      </div>
    </LoadingOverlay>
  );
};

export const ProcessingLoader = () => {
  const globalProcessing = useProcessingLoader();

  if (!globalProcessing) {
    return null;
  }

  return (
    <LoadingOverlay isOpen={true} message={globalProcessing.message}>
      {globalProcessing.target && (
        <LoaderTarget value={globalProcessing.target} />
      )}
    </LoadingOverlay>
  );
};