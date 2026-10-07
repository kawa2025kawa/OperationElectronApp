// electron/features/operation/application/statusStore.ts

import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import type { DependencyMasters } from "@shared/utils/dependency/dependencyUtils";
import type { MasterData } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { StatusTarget } from "./statusNotifier";

/**
 * アプリケーションのインメモリ状態（ターゲット情報、ステータス、マスタデータ）を保持するストア
 */
export class StatusStore {
  public readonly targets = new Map<string, StatusTarget>();
  public readonly statuses = new Map<string, OperationStatusState>();

  public dependencyMasters: DependencyMasters = {
    operationMasters: [],
    irregularMasters: [],
    todayIrregularMasters: [],
  };

  /**
   * スプレッドシート等から取得したマスタデータをストアに適用する
   */
  public setDependencyMasters(masterData: MasterData): void {
    this.dependencyMasters = {
      operationMasters: masterData.operations,
      irregularMasters: masterData.irregulars,
      todayIrregularMasters: masterData.todayIrregulars,
    };
  }

  /**
   * ストア内のすべての状態を初期化（クリア）する
   */
  public clear(): void {
    this.targets.clear();
    this.statuses.clear();
    this.dependencyMasters = {
      operationMasters: [],
      irregularMasters: [],
      todayIrregularMasters: [],
    };
  }
}

// シングルトンインスタンスとしてエクスポート
export const statusStore = new StatusStore();
