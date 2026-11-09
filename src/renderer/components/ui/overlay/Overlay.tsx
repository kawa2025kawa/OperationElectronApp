// src/renderer/components/ui/overlay/Overlay.tsx

import type { ReactNode } from "react";
import { m } from "motion/react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import type { InitStatus } from "@shared/types/initializationTypes";
import * as styles from "./overlay.css";

/* =========================================
   汎用バックドロップ Overlay
========================================= */

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
}

export const Overlay = ({ isOpen, onClick }: OverlayProps) => {
  const state = isOpen ? "open" : "closed";

  return (
    <m.div
      className={`${styles.backdropBase} ${styles.backdropStates[state]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    />
  );
};

/* =========================================
   Loading Content & Target
========================================= */

interface LoadingContentProps {
  message?: string;
  statusMessage?: string;
}

const DOT_DELAYS = [0, 0.2, 0.4];

const LoadingContent = ({
  message = "LOADING...",
  statusMessage = "INITIALIZING SYSTEM CORE",
}: LoadingContentProps) => {
  return (
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
};

interface LoaderTargetProps {
  value: string;
}

const LoaderTarget = ({ value }: LoaderTargetProps) => (
  <div className={styles.processingTargetPanel}>
    <span className={styles.processingTargetLabel}>PROCESSING TARGET</span>
    <span className={styles.processingTargetValue}>{value}</span>
  </div>
);

/* =========================================
   LoadingOverlay (内部共通ラッパー)
========================================= */

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

/* =========================================
   AppStartupLoader (アプリ起動専用)
========================================= */

const PANEL_LABELS: Record<keyof InitStatus, string> = {
  update: "App Update Check",
  operation: "Operation Data",
  irregular: "Irregular Data",
  auth: "Google Auth",
  store: "Store Master",
  jugyoin: "jugyoin Master",
  kokyuhyo: "kokyuhyo Data",
  tantou: "tantou Data",
};

const getStatusTone = (value: string) => {
  switch (value) {
    case "OK":
    case "CONNECTED":
      return styles.tone.ok;
    case "LOADING":
      return styles.tone.info;
    default:
      return styles.tone.ng;
  }
};

export const AppStartupLoader = () => {
  const { initStatus, showAppLoader } = useAppStore(
    useShallow((state) => ({
      initStatus: state.initStatus,
      showAppLoader: state.showAppLoader ?? true,
    })),
  );

  const entries = Object.entries(initStatus) as Array<
    [keyof InitStatus, string]
  >;

  const currentTargetEntry = entries.find(([, value]) => value === "LOADING");
  const currentTarget = currentTargetEntry
    ? PANEL_LABELS[currentTargetEntry[0]]
    : null;

  return (
    <LoadingOverlay
      isOpen={showAppLoader}
      message="INITIALIZING APPLICATION..."
      statusMessage="INITIALIZING SYSTEM CORE"
    >
      {currentTarget && <LoaderTarget value={currentTarget} />}

      <div className={styles.statusPanel}>
        {entries.map(([key, value]) => (
          <div className={styles.statusRow} key={String(key)}>
            <span>{PANEL_LABELS[key]}:</span>
            <span className={getStatusTone(value)}>{value}</span>
          </div>
        ))}
      </div>
    </LoadingOverlay>
  );
};

/* =========================================
   ProcessingLoader (処理中専用)
========================================= */

export const ProcessingLoader = () => {
  const globalProcessing = useAppStore(
    useShallow((state) => state.globalProcessing ?? null),
  );

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
