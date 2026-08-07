// src\renderer\components\ui\overlay\LoadingOverlay.tsx
import React from "react";
import { LoadingContent } from "./Overlay";
import type { InitStatus } from "@shared/types/initializationTypes";
import * as styles from "./overlay.css";

export interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  statusMessage?: string;
  dataStatus?: InitStatus;
}

const PANEL_LABELS: Record<keyof InitStatus, string> = {
  operation: "Operation Data",
  irregular: "Irregular Data",
  auth: "Google Auth",
  store: "Store Master",
  jugyoin: "Staff Master",
  kokyuhyo: "Schedule Data",
  tantou: "Duty Roster",
};

const LoadingOverlayComponent: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = "SYSTEM INITIALIZING",
  statusMessage = "INITIALIZING SYSTEM CORE",
  dataStatus,
}) => {
  return (
    <div
      className={`${styles.fullScreenLoaderBase} ${
        styles.fullScreenLoaderStates[isOpen ? "active" : "inactive"]
      }`}
    >
      <LoadingContent message={message} statusMessage={statusMessage} />

      {dataStatus && (
        <div className={styles.statusPanel}>
          {(Object.entries(dataStatus) as [keyof InitStatus, string][]).map(
            ([key, value]) => {
              const isOk = value === "OK" || value === "CONNECTED";
              const isLoading = value === "LOADING";
              const statusTone = isOk
                ? styles.tone.ok
                : isLoading
                  ? styles.tone.info
                  : styles.tone.ng;

              return (
                <div className={styles.statusRow} key={String(key)}>
                  <span>{PANEL_LABELS[key]}:</span>
                  <span className={statusTone}>{value}</span>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
};

export const LoadingOverlay = React.memo(LoadingOverlayComponent);
export default LoadingOverlay;
