// src/renderer/services/appService.ts

import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { updateService } from "@renderer/services/updateService";
import { useAppStore } from "@renderer/store";

/* =========================
 * Status Restore
 * ========================= */

async function restorePersistedStatuses(): Promise<void> {
  try {
    const savedStatuses = await window.electronAPI.invoke(
      IPC_CHANNELS.OPERATION.INITIALIZE_STATUS,
    );
    const updates = Object.values(savedStatuses);

    if (updates.length === 0) {
      return;
    }

    useAppStore.getState().applyOperationStatusUpdates(updates);
  } catch (error) {
    console.error(
      "[AppService] Failed to restore persisted operation statuses:",
      error,
    );
  }
}

/* =========================
 * Operation Initialization
 * ========================= */

async function loadOperationData(): Promise<void> {
  const store = useAppStore.getState();

  // 1. スプレッドシートのマスタデータを取得
  const masterData = await store.fetchMasterData();

  if (!masterData) {
    return;
  }

  // 2. JSON マスタから作業ターゲットを登録
  await window.electronAPI.invoke(IPC_CHANNELS.OPERATION.REGISTER_TARGETS);

  // 3. 永続化されたステータスを復元
  await restorePersistedStatuses();

  // 4. サマリー集計
  await store.fetchStatusSummary();
}

/* =========================
 * Initialization Status
 * ========================= */

function markAllTasksAsNg(): void {
  useAppStore.getState().setInitStatus({
    update: "NG",
    operation: "NG",
    irregular: "NG",
    store: "NG",
    jugyoin: "NG",
    kokyuhyo: "NG",
    tantou: "NG",
  });
}

/* =========================
 * Application Initialization
 * ========================= */

async function initializeAppData(): Promise<void> {
  const store = useAppStore.getState();

  await updateService.check();

  store.setInitStatus({
    auth: "LOADING",
  });

  const isAuthenticated = await store.checkAuthStatus();

  if (!isAuthenticated) {
    store.setInitStatus({
      auth: "NG",
    });

    markAllTasksAsNg();

    store.setCurrentView(APP_VIEW_IDS.AUTH);

    return;
  }

  store.setInitStatus({
    auth: "OK",
  });

  store.setCurrentView(APP_VIEW_IDS.OPERATION);

  await loadOperationData();
}

/* =========================
 * Service
 * ========================= */

export const appService = {
  initializeAppData,
};
