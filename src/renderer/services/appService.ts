// src/renderer/services/appService.ts

import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import { operationCommands } from "@renderer/services/commands";
import { updateService } from "@renderer/services/updateService";
import { useAppStore } from "@renderer/store";

import {
  ALL_SHEET_IDS,
  SHEETS,
  type OperationMasterData,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Types
 * ========================= */

type TargetSourceName = "operation" | "irregular" | "todayIrregular";

interface Target {
  kanriNo: string | number;
}

interface TargetSource {
  source: TargetSourceName;
  targets: Target[];
}

interface KanriNoSource {
  source: TargetSourceName;
  count: number;
}

/* =========================
 * Status Restore
 * ========================= */

/**
 * Main側に保存されているStatusをRenderer Storeへ復元する。
 *
 * Statusの取得・正規化はoperationCommands側で行う。
 * このServiceではOperationStatusStateだけを扱う。
 */
async function restorePersistedStatuses(): Promise<void> {
  try {
    const savedStatuses = await operationCommands.initializeStatus();

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

function getOperationMasterData(): OperationMasterData {
  const { sheetData } = useAppStore.getState();

  return {
    operations: sheetData[SHEETS.OPERATION.sheetName]?.data ?? [],

    irregulars: sheetData[SHEETS.IRREGULAR.sheetName]?.data ?? [],

    todayIrregulars: sheetData[SHEETS.TODAY_IRREGULAR.sheetName]?.data ?? [],
  };
}

function logOperationMasterData(masterData: OperationMasterData): void {
  console.log(
    "[AppService] sheetData operation masters:",
    masterData.operations.length,
  );

  console.log(
    "[AppService] sheetData irregular masters:",
    masterData.irregulars.length,
  );

  console.log(
    "[AppService] sheetData today irregular masters:",
    masterData.todayIrregulars.length,
  );
}

function logDuplicateKanriNos(sources: TargetSource[]): void {
  const countsByKanriNo = new Map<string, KanriNoSource[]>();

  for (const { source, targets } of sources) {
    for (const target of targets) {
      const kanriNo = String(target.kanriNo).trim();

      if (!kanriNo) {
        continue;
      }

      const entries = countsByKanriNo.get(kanriNo) ?? [];

      const existing = entries.find((entry) => entry.source === source);

      if (existing) {
        existing.count += 1;
      } else {
        entries.push({
          source,
          count: 1,
        });
      }

      countsByKanriNo.set(kanriNo, entries);
    }
  }

  const duplicates = [...countsByKanriNo.entries()]
    .filter(([, entries]) => {
      const totalCount = entries.reduce(
        (total, entry) => total + entry.count,
        0,
      );

      return totalCount > 1 || entries.some((entry) => entry.count > 1);
    })
    .map(([kanriNo, entries]) => ({
      kanriNo,
      entries,
    }));

  if (duplicates.length === 0) {
    return;
  }

  console.warn("[AppService] duplicate kanriNo:", duplicates);
}

function createTargetSources(masterData: OperationMasterData): TargetSource[] {
  return [
    {
      source: "operation",
      targets: masterData.operations,
    },
    {
      source: "irregular",
      targets: masterData.irregulars,
    },
    {
      source: "todayIrregular",
      targets: masterData.todayIrregulars,
    },
  ];
}

/**
 * Spreadsheetから取得したMasterを
 * Main側へ登録する。
 */
async function registerOperationTargets(): Promise<void> {
  const masterData = getOperationMasterData();

  logOperationMasterData(masterData);

  logDuplicateKanriNos(createTargetSources(masterData));

  await operationCommands.registerTargets(masterData);

  useAppStore.getState().refreshStatusSummary();
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

  /*
   * Spreadsheet取得と
   * Main側Status復元は独立しているため並列実行する。
   *
   * 両方完了してからMaster登録を行う。
   */
  await Promise.all([
    store.prefetchSheets(ALL_SHEET_IDS),
    restorePersistedStatuses(),
  ]);

  await registerOperationTargets();
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
