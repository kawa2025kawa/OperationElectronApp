// src/renderer/services/appService.ts

import { operationService } from "@renderer/features/operation/operationService";
import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import { updateService } from "@renderer/services/updateService";
import { useAppStore } from "@renderer/store";
import {
  createInitStatusPatch,
  INIT_STATUS_GROUPS,
} from "@shared/types/initializationTypes";
import { VIEW_MODES } from "@shared/types/registry/viewDefinition";

/** 運用データおよび不定期運用データの読み込みと初期化を行う */
async function loadOperationData(): Promise<void> {
  const store = useAppStore.getState();

  const markOperationDataFailed = (): void => {
    store.setInitStatus(
      createInitStatusPatch(INIT_STATUS_GROUPS.operationData, "NG"),
    );
  };

  if (!(await store.fetchMasterData())) {
    markOperationDataFailed();
    return;
  }

  try {
    await operationService.registerTargets();
    await operationService.initializeStatus();
  } catch (error) {
    console.error("[AppService] Failed to register operation targets:", error);
    markOperationDataFailed();
    return;
  }

  await store.fetchStatusSummary();

  const [operationResult, irregularResult] = await Promise.allSettled([
    store.fetchTableData(VIEW_MODES.OPERATION),
    operationService.getTableData(VIEW_MODES.IRREGULAR),
  ]);

  store.setInitStatus({
    operation: operationResult.status === "fulfilled" ? "OK" : "NG",
    irregular: irregularResult.status === "fulfilled" ? "OK" : "NG",
  });

  if (operationResult.status === "rejected") {
    console.error(
      "[AppService] Failed to fetch operation data:",
      operationResult.reason,
    );
  }

  if (irregularResult.status === "rejected") {
    console.error(
      "[AppService] Failed to fetch irregular data:",
      irregularResult.reason,
    );
  }
}

/** アプリケーション全体の初期化シーケンスを実行する */
async function initializeAppData(): Promise<void> {
  const store = useAppStore.getState();

  if (!(await updateService.check())) {
    console.warn("[AppService] Update check failed; skipping initialization.");
    store.settleUnsettledAsNg();
    return;
  }

  store.setInitStatus({ auth: "LOADING" });

  if (!(await store.checkAuthStatus())) {
    store.settleUnsettledAsNg();
    store.setCurrentView(APP_VIEW_IDS.AUTH);
    return;
  }

  store.setInitStatus({ auth: "OK" });
  store.setCurrentView(APP_VIEW_IDS.OPERATION);

  await loadOperationData();
}

export const appService = {
  initializeAppData,
};
