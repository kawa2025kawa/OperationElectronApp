// src/renderer/services/appService.ts

import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import { trpc } from "@renderer/lib/trpc";
import { updateService } from "@renderer/services/updateService";
import { useAppStore } from "@renderer/store";

import type { MasterData } from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Status Restore
 * ========================= */

async function restorePersistedStatuses(): Promise<void> {
  try {
    const savedStatuses = await trpc.operation.initializeStatus.mutate();
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
 * Operation Master
 * ========================= */

async function registerOperationTargets(masterData: MasterData): Promise<void> {
  await trpc.operation.registerTargets.mutate({ masterData });

  // ポーリングを開始する処理
  await trpc.operation.startPolling.mutate();

  await useAppStore.getState().fetchStatusSummary();
}

/* =========================
 * Initialization Status
 * ========================= */

function markAllTasksAsNg(): void {
  useAppStore.getState().setInitStatus({
    update: "NG",
    operation: "NG",
    irregular: "NG",
    todayIrregular: "NG",
    store: "NG",
    jugyoin: "NG",
    kokyuhyo: "NG",
    tantou: "NG",
  });
}

/* =========================
 * Operation Initialization
 * ========================= */

async function loadOperationData(): Promise<void> {
  const store = useAppStore.getState();

  // 1. マスターデータを先に取得
  const masterData = await store.fetchMasterData();

  if (!masterData) {
    return;
  }

  // 2. ステータスを復元
  await restorePersistedStatuses();

  // 3. ターゲット登録とポーリング開始
  await registerOperationTargets(masterData);
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

