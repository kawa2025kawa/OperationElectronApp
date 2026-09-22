// src/renderer/components/ui/overlay/LoadingOverlay.tsx

import React from "react";
import { LoadingContent } from "./Overlay";
import type { InitStatus } from "@shared/types/system";
import * as styles from "./overlay.css";

export interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  statusMessage?: string;
  dataStatus?: InitStatus;
  processingTarget?: string | null;
}

const PANEL_LABELS: Record<keyof Required<InitStatus>, string> = {
  update: "App Update Check",
  operation: "Operation Data",
  irregular: "Irregular Data",
  auth: "Google Auth",
  store: "Store Master",
  jugyoin: "Staff Master",
  kokyuhyo: "Schedule Data",
  tantou: "Duty Roster",
};

const getStatusTone = (value: string) => {
  if (value === "OK" || value === "CONNECTED") {
    return styles.tone.ok;
  }

  if (value === "LOADING") {
    return styles.tone.info;
  }

  return styles.tone.ng;
};

const LoadingOverlayComponent: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = "SYSTEM INITIALIZING",
  statusMessage = "INITIALIZING SYSTEM CORE",
  dataStatus,
  processingTarget,
}) => {
  const loaderState = isOpen ? "active" : "inactive";

  // 🎯 processingTarget が明示されていない場合、dataStatus で現在 LOADING の項目ラベルを自動取得
  const currentTarget = React.useMemo(() => {
    if (processingTarget) return processingTarget;
    if (!dataStatus) return null;

    const loadingEntry = (
      Object.entries(dataStatus) as [keyof InitStatus, string][]
    ).find(([_, value]) => value === "LOADING");

    if (!loadingEntry) return null;

    const [key] = loadingEntry;
    return PANEL_LABELS[key as keyof Required<InitStatus>] ?? String(key);
  }, [dataStatus, processingTarget]);

  return (
    <div
      className={`${styles.fullScreenLoaderBase} ${styles.fullScreenLoaderStates[loaderState]}`}
    >
      <LoadingContent message={message} statusMessage={statusMessage} />

      {/* 🎯 target が存在する時だけ左下パネルを描画 */}
      {currentTarget && (
        <div className={styles.processingTargetPanel}>
          <span className={styles.processingTargetLabel}>
            PROCESSING TARGET
          </span>
          <span className={styles.processingTargetValue}>{currentTarget}</span>
        </div>
      )}

      {dataStatus && (
        <div className={styles.statusPanel}>
          {(Object.entries(dataStatus) as [keyof InitStatus, string][]).map(
            ([key, value]) => (
              <div className={styles.statusRow} key={String(key)}>
                <span>
                  {PANEL_LABELS[key as keyof Required<InitStatus>] ??
                    String(key)}
                  :
                </span>

                <span className={getStatusTone(value)}>{value}</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export const LoadingOverlay = React.memo(LoadingOverlayComponent);
LoadingOverlay.displayName = "LoadingOverlay";
