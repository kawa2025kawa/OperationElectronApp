// src/renderer/components/ui/overlay/useOverlay.ts

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import type { InitStatus } from "@shared/types/initializationTypes";
import * as styles from "./overlay.css";

const PANEL_LABELS: Record<keyof InitStatus, string> = {
  update: "App Update Check",
  operation: "Operation Data",
  irregular: "Irregular Data",
  operationMaster: "Operation Master",
  irregularMaster: "Irregular Master",
  rdp: "RDP Master",
  auth: "Google Auth",
  store: "Store Master",
  jugyoin: "jugyoin Master",
  kokyuhyo: "kokyuhyo Data",
  tantou: "tantou Data",
};

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

export function useAppStartupLoader() {
  const { initStatus, showAppLoader } = useAppStore(
    useShallow((state) => ({
      initStatus: state.initStatus,
      showAppLoader: state.showAppLoader ?? true,
    })),
  );

  const statusRows = useMemo(() => {
    const entries = Object.entries(initStatus) as Array<
      [keyof InitStatus, string]
    >;

    return entries.map(([key, value]) => ({
      key: String(key),
      label: PANEL_LABELS[key],
      value,
      toneClass: getStatusTone(value),
    }));
  }, [initStatus]);

  const currentTarget = useMemo(() => {
    const loadingRow = statusRows.find((row) => row.value === "LOADING");
    return loadingRow?.label ?? null;
  }, [statusRows]);

  return {
    showAppLoader,
    currentTarget,
    statusRows,
  };
}

export function useProcessingLoader() {
  return useAppStore(
    useShallow((state) => state.globalProcessing ?? null),
  );
}