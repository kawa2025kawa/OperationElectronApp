import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@renderer/store";
import { LoadingContent } from "./Overlay";
import type { InitStatus } from "@shared/types/initializationTypes";
import * as styles from "./overlay.css";

const PANEL_LABELS: Record<keyof InitStatus, string> = {
  update: "App Update Check",
  operation: "Operation Data",
  irregular: "Irregular Data",
  todayIrregular: "Today Irregular Data",
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

interface LoaderTargetProps {
  value: string;
}

const LoaderTarget = ({ value }: LoaderTargetProps) => (
  <div className={styles.processingTargetPanel}>
    <span className={styles.processingTargetLabel}>PROCESSING TARGET</span>

    <span className={styles.processingTargetValue}>{value}</span>
  </div>
);

export interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  statusMessage?: string;
  children?: ReactNode;
}

export const LoadingOverlay = ({
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

/**
 * アプリ起動専用Loader
 *
 * 起動時の初期化状態だけを表示する。
 * globalProcessing には関与しない。
 */
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

/**
 * 処理中専用Loader
 *
 * アプリ起動完了後の globalProcessing だけを表示する。
 * 起動Loaderの状態には関与しない。
 */
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
