import { commands } from "@renderer/services/commands";
import { DATA_LOADING_STATUS } from "@renderer/store/slices/initSlice";
import { useAppStore } from "@renderer/store";
import {
  DEFAULT_ACTIVE_FLAGS,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import type { SheetId } from "@shared/types/spreadsheet/sheetTypes";

async function showMainWindow(): Promise<void> {
  try {
    await commands.showMainWindow();
  } catch (error) {
    console.error("[appService] Failed to show main window:", error);
  }
}

const MASTER_SHEET_IDS = [
  "OperationMasterList",
  "IrregularMasterList",
  "TodayIrregularMasterList",
] as const satisfies readonly SheetId[];

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function setupOperationIpcListeners(): void {
  commands.onOperationStatusUpdated((item: OperationItem) => {
    if (item && item.kanriNo != null) {
      console.log(
        `[Renderer IPC] Mainからステータス更新通知を受信 -> No.${item.kanriNo}, Status: ${item.status}, Start: ${item.startTime ?? ""}, End: ${item.endTime ?? ""}`,
      );

      useAppStore.getState().updateOperationStatusFromMain({
        kanriNo: item.kanriNo,
        status: item.status ?? "",
        comment: item.comment ?? undefined,
        startTime: item.startTime ?? undefined,
        endTime: item.endTime ?? undefined,
        expectedStartTime: item.expectedStartTime ?? undefined,
        expectedEndTime: item.expectedEndTime ?? undefined,
        substatus: item.substatus ?? undefined,
        info: item.info ?? undefined,
      });
    }
  });

  console.log(
    "[appService] Registered IPC listener via commands.onOperationStatusUpdated",
  );
}

async function loadMasterData(isAuthenticated: boolean): Promise<{
  operations: OperationItem[];
  irregulars: OperationItem[];
  todayIrregulars: OperationItem[];
}> {
  const store = useAppStore.getState();
  const todayStr = getTodayString();

  console.log("[appService] Checking local master data cache...");

  const cached = await commands.loadOperationMasterCache();

  if (cached && cached.fetchedDate === todayStr) {
    console.log(
      `[appService] Using today's cached master data (Date: ${cached.fetchedDate})`,
    );

    return {
      operations: cached.operations ?? [],
      irregulars: cached.irregulars ?? [],
      todayIrregulars: cached.todayIrregulars ?? [],
    };
  }

  if (isAuthenticated && store.accessToken) {
    while (true) {
      try {
        console.log(
          "[appService] Fetching initial master data from Google Sheets API...",
        );

        await Promise.all(
          MASTER_SHEET_IDS.map((id) =>
            store.fetchSheetData(id, store.accessToken!, false, true),
          ),
        );

        const latestStore = useAppStore.getState();

        const isAllFetched = MASTER_SHEET_IDS.every((id) =>
          Array.isArray(latestStore.sheetData[id]?.data),
        );

        if (isAllFetched) {
          const [operations, irregulars, todayIrregulars] =
            MASTER_SHEET_IDS.map(
              (id) =>
                (latestStore.sheetData[id]?.data ?? []) as OperationItem[],
            );

          await commands.syncOperationMaster({
            operations,
            irregulars,
            todayIrregulars,
          });

          console.log(
            `[appService] Successfully fetched online master data (Ops: ${operations.length}, Irregs: ${irregulars.length}, Today: ${todayIrregulars.length})`,
          );

          return {
            operations,
            irregulars,
            todayIrregulars,
          };
        }

        throw new Error(
          "スプレッドシートデータの一部または全件の取得に失敗しました",
        );
      } catch (error) {
        console.warn("[appService] Failed to fetch online master data:", error);

        if (cached) {
          const shouldRetry = window.confirm(
            "スプレッドシートからのデータ取得（ネットワーク通信）に失敗しました。\n\n" +
              "【OK】: 再度通信を試みる（再試行）\n" +
              `【キャンセル】: 前回の保存データ（${cached.fetchedDate} 時点）を使用して起動する`,
          );

          if (!shouldRetry) {
            console.log(
              `[appService] User chosen fallback to previous cache (Date: ${cached.fetchedDate})`,
            );

            return {
              operations: cached.operations ?? [],
              irregulars: cached.irregulars ?? [],
              todayIrregulars: cached.todayIrregulars ?? [],
            };
          }
        } else {
          const shouldRetry = window.confirm(
            "ネットワークエラーにより最新データの取得に失敗しました（保存されているキャッシュもありません）。\n\n" +
              "【OK】: 再度接続を試みる\n" +
              "【キャンセル】: 空の状態で起動する",
          );

          if (!shouldRetry) {
            return {
              operations: [],
              irregulars: [],
              todayIrregulars: [],
            };
          }
        }
      }
    }
  }

  if (cached) {
    return {
      operations: cached.operations ?? [],
      irregulars: cached.irregulars ?? [],
      todayIrregulars: cached.todayIrregulars ?? [],
    };
  }

  return {
    operations: [],
    irregulars: [],
    todayIrregulars: [],
  };
}

async function registerOperationTargets(
  operations: OperationItem[],
  todayIrregulars: OperationItem[],
): Promise<void> {
  const targets = [...operations, ...todayIrregulars].filter(({ kanriNo }) =>
    Boolean(kanriNo),
  );

  if (targets.length === 0) return;

  await commands.registerTargets(targets);

  await commands.setActiveFlags(DEFAULT_ACTIVE_FLAGS);
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

  store.setInitStatus({
    auth: "OK",
  });

  await store.prefetchSheets(store.accessToken || undefined);
}

async function loadInitialData(): Promise<void> {
  const store = useAppStore.getState();

  const [isAuthenticated, savedStatuses] = await Promise.all([
    store.checkAuthStatus(),
    commands.initializeStatus(),
  ]);

  const { operations, irregulars, todayIrregulars } =
    await loadMasterData(isAuthenticated);

  await Promise.all([
    registerOperationTargets(operations, todayIrregulars),
    initializeSheets(isAuthenticated),
  ]);

  store.setInitialRawData(
    operations,
    irregulars,
    savedStatuses,
    todayIrregulars,
  );
}

export const appService = {
  async initializeApp(): Promise<void> {
    const store = useAppStore.getState();

    store.setInitStatus(DATA_LOADING_STATUS);

    try {
      await showMainWindow();

      setupOperationIpcListeners();

      await loadInitialData();

      store.markInitializationCompleted();
    } catch (error) {
      console.error("[appService] Failed to initialize application:", error);

      store.markInitializationFailed(error);
    }
  },
};
