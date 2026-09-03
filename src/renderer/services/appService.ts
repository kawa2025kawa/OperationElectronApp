// src/renderer/services/appService.ts

import irregularData from "@resources/json/irregularData.json";
import operationData from "@resources/json/operationData.json";
import { commands } from "@renderer/services/commands";
import { checkAndApplyUpdate } from "@renderer/services/updateService";
import { DATA_LOADING_STATUS } from "@renderer/store/slices/initSlice";
import { useAppStore } from "@renderer/store";
import type { OperationItem } from "@shared/types/operation";

const operations = operationData as OperationItem[];
const irregulars = irregularData as OperationItem[];

async function showMainWindow(): Promise<void> {
  try {
    await commands.showMainWindow();
  } catch (error) {
    console.error("[appService] Failed to show main window:", error);
  }
}

async function registerOperationTargets(): Promise<void> {
  const allItems = [...operations, ...irregulars];
  const targets = allItems.filter(({ kanriNo }) => Boolean(kanriNo));

  if (targets.length === 0) return;

  // 1. ターゲットリストの登録 (バックエンドの statusManager/apiTargets へ登録)
  await commands.registerTargets(targets);

  // 2. バックエンドの評価ロジック(pollingStatusEvaluator)が求める ActiveFlags の同期
  // ※ 個別の kanriNo ではなく、バックエンド仕様のグループキー構造で渡す
  const defaultActiveFlags = {
    is1CActive: true,
    is2CActive: true,
    is3CActive: true,
  };

  await commands.setActiveFlags(defaultActiveFlags);
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

export const appService = {
  async initializeApp(): Promise<void> {
    const store = useAppStore.getState();
    store.setIsLoading(true);

    try {
      await showMainWindow();

      // 1. 初期ステータス（update含む）の画面セット
      store.setInitStatus(DATA_LOADING_STATUS);

      // 2. アップデートチェック
      const hasUpdateApplied = await checkAndApplyUpdate();
      if (hasUpdateApplied) {
        return;
      }

      // 3. アップデートチェック完了
      store.setInitStatus({ update: "OK" });

      // 4. 重い初期ロードを実行 (ターゲット登録 & ActiveFlags 同期)
      await loadInitialData();

      // 6. 完成処理を initSlice へ委譲
      store.markInitializationCompleted();
    } finally {
      store.setIsLoading(false);
    }
  },
};
