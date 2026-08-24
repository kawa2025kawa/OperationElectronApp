// src/shared/store/slices/services/appService.ts

import irregularData from "@resources/json/irregularData.json";
import operationData from "@resources/json/operationData.json";
import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";

const operations = operationData as OperationItem[];
const irregulars = irregularData as OperationItem[];

const INITIAL_LOADING_STATUS = {
  operation: "LOADING",
  irregular: "LOADING",
  auth: "LOADING",
  store: "LOADING",
  jugyoin: "LOADING",
  kokyuhyo: "LOADING",
  tantou: "LOADING",
} as const;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

async function showMainWindow(): Promise<void> {
  try {
    await commands.showMainWindow();
  } catch (error) {
    console.error("[appService] Failed to show main window:", error);
  }
}

async function registerOperationTargets(): Promise<void> {
  const targets = [...operations, ...irregulars].filter(({ kanriNo }) =>
    Boolean(kanriNo),
  );

  if (targets.length > 0) {
    await commands.registerTargets(targets);
  }
}

async function initializeSheets(isAuthenticated: boolean): Promise<void> {
  const store = useAppStore.getState();

  if (!isAuthenticated) {
    store.setInitStatus({
      auth: "PENDING",
      store: "PENDING",
      jugyoin: "PENDING",
      kokyuhyo: "PENDING",
      tantou: "PENDING",
    });
    return;
  }

  store.setInitStatus({ auth: "OK" });
  await store.prefetchSheets(store.accessToken || undefined);
}

async function loadInitialData(): Promise<void> {
  const store = useAppStore.getState();

  const [isAuthenticated, savedStatuses] = await Promise.all([
    store.checkAuthStatus(),
    commands.initializeStatus(),
  ]);

  await Promise.all([
    registerOperationTargets(),
    initializeSheets(isAuthenticated),
  ]);

  store.setInitialRawData(operations, irregulars, savedStatuses);
}

function handleInitializationError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[appService] Failed to initialize app:", message);

  const store = useAppStore.getState();
  store.setIsAuthenticated(false);
  store.setAccessToken(null);

  // 失敗時に OK / CONNECTED 以外のステータスを一括で NG に更新
  const updatedStatus = Object.fromEntries(
    Object.entries(store.initStatus).map(([key, val]) => [
      key,
      val === "OK" || val === "CONNECTED" ? val : "NG",
    ]),
  );

  store.setInitStatus(updatedStatus);
}

function markInitializationCompleted(): void {
  const store = useAppStore.getState();

  store.setInitStatus({
    operation: "OK",
    irregular: "OK",
  });

  store.recalculateSummary();
  store.setIsInitialLoaded(true);
}

// ----------------------------------------------------------------------------
// Service
// ----------------------------------------------------------------------------

export const appService = {
  async initializeApp(): Promise<void> {
    const store = useAppStore.getState();
    store.setIsLoading(true);

    try {
      await showMainWindow();
      store.setInitStatus(INITIAL_LOADING_STATUS);
      await loadInitialData();
      markInitializationCompleted();
    } catch (error) {
      handleInitializationError(error);
      throw error;
    } finally {
      store.setIsLoading(false);
    }
  },
};
