// src/renderer/components/ui/overlay/Overlay.tsx

import { useMemo, type ReactNode } from "react";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { InitStatus } from "@shared/types/initializationTypes";
import * as styles from "./overlay.css";

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
}

const PANEL_LABELS: Record<keyof InitStatus, string> = {
  update: "App Update Check",
  operation: "Operation Data",
  irregular: "Irregular Data",
  operationMaster: "Operation Master",
  irregularMaster: "Irregular Master",
  rdp: "RDP Master",
  auth: "Google Auth",
  sheetSync: "Sheet Daily Sync",
  store: "Store Master",
  jugyoin: "jugyoin Master",
  kokyuhyo: "kokyuhyo Data",
  tantou: "tantou Data",
};

const DOT_DELAYS = [0, 0.2, 0.4];

function getStatusTone(value: string): string {
  switch (value) {
    case "OK":
    case "CONNECTED":
      return styles.tone.ok;
    case "LOADING":
      return styles.tone.info;
    default:
      return styles.tone.ng;
  }
}

export const Overlay = ({ isOpen, onClick }: OverlayProps) => (
  <div
    className={clsx(
      styles.backdropBase,
      styles.backdropStates[isOpen ? "open" : "closed"],
    )}
    onClick={onClick}
  />
);

const LoaderTarget = ({ value }: { value: string }) => (
  <div className={styles.processingTargetPanel}>
    <span className={styles.processingTargetLabel}>PROCESSING TARGET</span>
    <span className={styles.processingTargetValue}>{value}</span>
  </div>
);

const LoadingOverlay = ({
  isOpen,
  message = "SYSTEM INITIALIZING",
  statusMessage = "INITIALIZING SYSTEM CORE",
  children,
}: {
  isOpen: boolean;
  message?: string;
  statusMessage?: string;
  children?: ReactNode;
}) => (
  <div
    className={clsx(
      styles.fullScreenLoaderBase,
      styles.fullScreenLoaderStates[isOpen ? "active" : "inactive"],
    )}
  >
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
    {children}
  </div>
);

export const AppStartupLoader = () => {
  const { initStatus, showAppLoader } = useAppStore(
    useShallow((state) => ({
      initStatus: state.initStatus,
      showAppLoader: state.showAppLoader ?? true,
    })),
  );

  const statusRows = useMemo(
    () =>
      (Object.entries(initStatus) as Array<[keyof InitStatus, string]>).map(
        ([key, value]) => ({
          key: String(key),
          label: PANEL_LABELS[key],
          value,
          toneClass: getStatusTone(value),
        }),
      ),
    [initStatus],
  );

  const currentTarget =
    statusRows.find((row) => row.value === "LOADING")?.label ?? null;

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
