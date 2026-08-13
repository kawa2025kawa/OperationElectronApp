// src/shared/store/slices/services/appService.ts

import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store";

import type {
  JobDependenciesJson,
  OperationItem,
} from "@shared/types/operationType";

import irregularData from "@resources/json/irregularData.json";
import jobDependenciesData from "@resources/json/jobDependencies.json";
import operationData from "@resources/json/operationData.json";

// ============================================================
// Initial Data
// ============================================================

const operations = operationData as OperationItem[];
const irregulars = irregularData as OperationItem[];

const initialJobDependencies = jobDependenciesData as JobDependenciesJson;

// ============================================================
// Constants
// ============================================================

const INITIAL_LOADING_STATUS = {
  operation: "LOADING",
  irregular: "LOADING",
  auth: "LOADING",
  store: "LOADING",
  jugyoin: "LOADING",
  kokyuhyo: "LOADING",
  tantou: "LOADING",
} as const;

// ============================================================
// Helpers
// ============================================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function showMainWindow(): Promise<void> {
  try {
    await commands.showMainWindow();
  } catch (error) {
    console.error("[appService] Failed to show main window:", error);
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

async function registerOperationTargets(): Promise<void> {
  const targets = [...operations, ...irregulars].filter(({ kanriNo }) =>
    Boolean(kanriNo),
  );

  if (targets.length === 0) {
    return;
  }

  await commands.registerTargets(targets);
}

function setInitializationError(): void {
  const store = useAppStore.getState();

  store.setIsAuthenticated(false);
  store.setAccessToken(null);

  const status = { ...store.initStatus };

  for (const key of Object.keys(status) as Array<keyof typeof status>) {
    if (status[key] !== "OK" && status[key] !== "CONNECTED") {
      status[key] = "NG";
    }
  }

  store.setInitStatus(status);
}

function handleInitializationError(error: unknown): void {
  console.error(
    "[appService] Failed to initialize app:",
    getErrorMessage(error),
  );

  setInitializationError();
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

  // jobDependencies.json はここで一度だけ読み込み、
  // 以降は Store の jobDependencies を参照する。
  store.setInitialRawData(
    operations,
    irregulars,
    savedStatuses,
    initialJobDependencies,
  );
}

function markInitializationCompleted(): void {
  const store = useAppStore.getState();

  store.setInitStatus({
    operation: "OK",
    irregular: "OK",
  });

  store.setIsInitialLoaded(true);
}

// ============================================================
// Service
// ============================================================

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
